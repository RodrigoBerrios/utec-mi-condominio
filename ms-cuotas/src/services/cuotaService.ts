import { query } from '../config/database';
import { Cuota, CreateCuota, EstadoCuenta } from '../types/cuota';
import { EventService } from './eventService';

const eventService = new EventService();

export class CuotaService {
  
  async obtenerCuotaPorId(cuotaId: string): Promise<Cuota | null> {
    try {
      const result = await query('SELECT * FROM cuotas WHERE cuota_id = $1', [cuotaId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error obteniendo cuota por ID:', error);
      throw new Error('Error al obtener cuota');
    }
  }

  async crearCuota(cuotaData: CreateCuota, cuotaId: string): Promise<Cuota> {
    try {
      const insertQuery = `
        INSERT INTO cuotas (
          cuota_id, usuario_id, inmueble_id, periodo, monto, 
          fecha_vencimiento, estado, fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', NOW())
        RETURNING *
      `;

      const values = [
        cuotaId,
        cuotaData.usuarioId,
        cuotaData.inmuebleId,
        cuotaData.periodo,
        cuotaData.monto,
        cuotaData.fechaVencimiento
      ];

      const result = await query(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creando cuota:', error);
      throw new Error('Error al crear cuota');
    }
  }

  async actualizarCuota(cuotaId: string, cambios: Partial<Cuota>): Promise<Cuota> {
    try {
      const cuotaExistente = await this.obtenerCuotaPorId(cuotaId);
      if (!cuotaExistente) {
        throw new Error('Cuota no encontrada');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (cambios.monto !== undefined) {
        updateFields.push(`monto = $${paramIndex}`);
        values.push(cambios.monto);
        paramIndex++;
      }

      if (cambios.fechaVencimiento !== undefined) {
        updateFields.push(`fecha_vencimiento = $${paramIndex}`);
        values.push(cambios.fechaVencimiento);
        paramIndex++;
      }

      if (cambios.estado !== undefined) {
        updateFields.push(`estado = $${paramIndex}`);
        values.push(cambios.estado);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      updateFields.push(`fecha_actualizacion = NOW()`);
      values.push(cuotaId);

      const updateQuery = `
        UPDATE cuotas 
        SET ${updateFields.join(', ')}
        WHERE cuota_id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error actualizando cuota:', error);
      throw error;
    }
  }

  async eliminarCuota(cuotaId: string): Promise<boolean> {
    try {
      const cuota = await this.obtenerCuotaPorId(cuotaId);
      if (!cuota) {
        throw new Error('Cuota no encontrada');
      }

      if (cuota.estado === 'pagado') {
        throw new Error('No se puede eliminar una cuota pagada');
      }

      await query('DELETE FROM cuotas WHERE cuota_id = $1', [cuotaId]);
      return true;
    } catch (error) {
      console.error('Error eliminando cuota:', error);
      throw error;
    }
  }

  async marcarComoPagada(cuotaId: string, metodoPago?: string): Promise<Cuota> {
    try {
      const cuota = await this.obtenerCuotaPorId(cuotaId);
      if (!cuota) {
        throw new Error('Cuota no encontrada');
      }

      if (cuota.estado === 'pagado') {
        throw new Error('La cuota ya está marcada como pagada');
      }

      const updateQuery = `
        UPDATE cuotas 
        SET estado = 'pagado', fecha_pago = NOW()
        WHERE cuota_id = $1
        RETURNING *
      `;

      const result = await query(updateQuery, [cuotaId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error marcando cuota como pagada:', error);
      throw error;
    }
  }

  async obtenerCuotasPorUsuario(usuarioId: string, estado?: string, limit = 50, offset = 0): Promise<Cuota[]> {
    try {
      let whereClause = 'WHERE usuario_id = $1';
      const params: any[] = [usuarioId];
      let paramIndex = 2;

      if (estado) {
        whereClause += ` AND estado = $${paramIndex}`;
        params.push(estado);
        paramIndex++;
      }

      const selectQuery = `
        SELECT * FROM cuotas 
        ${whereClause}
        ORDER BY fecha_vencimiento DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await query(selectQuery, params);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo cuotas por usuario:', error);
      throw new Error('Error al obtener cuotas del usuario');
    }
  }

  async obtenerEstadoCuenta(usuarioId: string): Promise<EstadoCuenta> {
    try {
      // Obtener resumen del estado de cuenta
      const resumenQuery = `
        SELECT 
          usuario_id,
          COUNT(*) as total_cuotas,
          SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as total_pagado,
          SUM(CASE WHEN estado != 'pagado' THEN monto ELSE 0 END) as total_pendiente,
          COUNT(CASE WHEN estado = 'vencido' THEN 1 END) as cuotas_vencidas,
          MAX(CASE WHEN estado = 'pagado' THEN fecha_pago END) as ultimo_pago
        FROM cuotas 
        WHERE usuario_id = $1
        GROUP BY usuario_id
      `;

      const resumenResult = await query(resumenQuery, [usuarioId]);

      if (resumenResult.rows.length === 0) {
        throw new Error('No se encontraron cuotas para este usuario');
      }

      const resumen = resumenResult.rows[0];

      // Obtener todas las cuotas del usuario
      const cuotasQuery = `
        SELECT * FROM cuotas 
        WHERE usuario_id = $1 
        ORDER BY fecha_vencimiento DESC
      `;

      const cuotasResult = await query(cuotasQuery, [usuarioId]);

      return {
        usuarioId,
        totalPendiente: parseFloat(resumen.total_pendiente || 0),
        totalPagado: parseFloat(resumen.total_pagado || 0),
        cuotasVencidas: parseInt(resumen.cuotas_vencidas || 0),
        ultimoPago: resumen.ultimo_pago,
        cuotas: cuotasResult.rows
      };
    } catch (error) {
      console.error('Error obteniendo estado de cuenta:', error);
      throw error;
    }
  }

  async obtenerMorosos(): Promise<any[]> {
    try {
      const morosoQuery = `
        SELECT 
          usuario_id,
          COUNT(*) as cuotas_vencidas,
          SUM(monto) as monto_total_vencido,
          MIN(fecha_vencimiento) as primera_cuota_vencida,
          MAX(fecha_vencimiento) as ultima_cuota_vencida,
          EXTRACT(DAY FROM NOW() - MIN(fecha_vencimiento)) as dias_moroso
        FROM cuotas 
        WHERE estado = 'vencido'
        GROUP BY usuario_id
        HAVING COUNT(*) > 0
        ORDER BY monto_total_vencido DESC
      `;

      const result = await query(morosoQuery);
      return result.rows.map(row => ({
        usuarioId: row.usuario_id,
        cuotasVencidas: parseInt(row.cuotas_vencidas),
        montoTotalVencido: parseFloat(row.monto_total_vencido),
        primeraCuotaVencida: row.primera_cuota_vencida,
        ultimaCuotaVencida: row.ultima_cuota_vencida,
        diasMoroso: parseInt(row.dias_moroso)
      }));
    } catch (error) {
      console.error('Error obteniendo morosos:', error);
      throw new Error('Error al obtener lista de morosos');
    }
  }

  async verificarCuotasVencidas(): Promise<void> {
    try {
      // Buscar y actualizar cuotas vencidas
      const updateQuery = `
        UPDATE cuotas 
        SET estado = 'vencido' 
        WHERE fecha_vencimiento < NOW() 
          AND estado = 'pendiente'
        RETURNING cuota_id, usuario_id, inmueble_id, monto, fecha_vencimiento
      `;

      const result = await query(updateQuery);
      
      // Enviar eventos para cada cuota vencida
      for (const cuota of result.rows) {
        await eventService.publishCuotaVencida({
          cuotaId: cuota.cuota_id,
          usuarioId: cuota.usuario_id,
          inmuebleId: cuota.inmueble_id,
          monto: parseFloat(cuota.monto),
          fechaVencimiento: cuota.fecha_vencimiento.toISOString(),
          diasVencido: Math.floor((Date.now() - new Date(cuota.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    } catch (error) {
      console.error('Error verificando cuotas vencidas:', error);
      throw error;
    }
  }
} 