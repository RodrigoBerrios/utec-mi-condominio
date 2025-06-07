import { ScheduledEvent } from 'aws-lambda';
import { query } from '../config/database';
import { EventService } from '../services/eventService';
import { v4 as uuidv4 } from 'uuid';

const eventService = new EventService();

export const checkCuotasVencidas = async (event: ScheduledEvent): Promise<void> => {
  console.log('Iniciando verificación de cuotas vencidas...');
  
  try {
    // Buscar cuotas vencidas (fecha de vencimiento pasada y estado pendiente)
    const cuotasVencidasQuery = `
      SELECT 
        cuota_id,
        usuario_id,
        inmueble_id,
        monto,
        fecha_vencimiento,
        EXTRACT(DAY FROM NOW() - fecha_vencimiento) as dias_vencido
      FROM cuotas 
      WHERE fecha_vencimiento < NOW() 
        AND estado = 'pendiente'
        AND EXTRACT(DAY FROM NOW() - fecha_vencimiento) > 0
    `;

    const cuotasVencidas = await query(cuotasVencidasQuery);

    console.log(`Encontradas ${cuotasVencidas.rows.length} cuotas vencidas`);

    // Actualizar estado de cuotas vencidas
    if (cuotasVencidas.rows.length > 0) {
      const cuotaIds = cuotasVencidas.rows.map((row: any) => row.cuota_id);
      const updateQuery = `
        UPDATE cuotas 
        SET estado = 'vencido' 
        WHERE cuota_id = ANY($1) AND estado = 'pendiente'
      `;
      
      await query(updateQuery, [cuotaIds]);
    }

    // Enviar eventos para cada cuota vencida
    for (const cuota of cuotasVencidas.rows) {
      await eventService.publishCuotaVencida({
        cuotaId: cuota.cuota_id,
        usuarioId: cuota.usuario_id,
        inmuebleId: cuota.inmueble_id,
        monto: parseFloat(cuota.monto),
        fechaVencimiento: cuota.fecha_vencimiento.toISOString(),
        diasVencido: parseInt(cuota.dias_vencido),
      });
    }

    // Buscar cuotas próximas a vencer (en los próximos 7 días)
    const cuotasProximasQuery = `
      SELECT 
        cuota_id,
        usuario_id,
        inmueble_id,
        monto,
        fecha_vencimiento,
        EXTRACT(DAY FROM fecha_vencimiento - NOW()) as dias_para_vencimiento
      FROM cuotas 
      WHERE fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND estado = 'pendiente'
    `;

    const cuotasProximas = await query(cuotasProximasQuery);

    console.log(`Encontradas ${cuotasProximas.rows.length} cuotas próximas a vencer`);

    // Enviar recordatorios para cuotas próximas a vencer
    for (const cuota of cuotasProximas.rows) {
      await eventService.publishRecordatorioPago({
        cuotaId: cuota.cuota_id,
        usuarioId: cuota.usuario_id,
        inmuebleId: cuota.inmueble_id,
        monto: parseFloat(cuota.monto),
        fechaVencimiento: cuota.fecha_vencimiento.toISOString(),
        diasParaVencimiento: parseInt(cuota.dias_para_vencimiento),
      });
    }

    console.log('Verificación de cuotas completada exitosamente');
  } catch (error) {
    console.error('Error en verificación de cuotas vencidas:', error);
    throw error;
  }
};

// Nuevo handler para generar cuotas mensuales automáticamente
export const generateCuotasMensuales = async (event: ScheduledEvent): Promise<void> => {
  console.log('Iniciando generación automática de cuotas mensuales...');
  
  try {
    // Obtener el período actual (año-mes)
    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`Generando cuotas para el período: ${periodo}`);

    // Verificar si ya existen cuotas para este período
    const existenCuotasQuery = `
      SELECT COUNT(*) as count 
      FROM cuotas 
      WHERE periodo = $1
    `;
    
    const existenResult = await query(existenCuotasQuery, [periodo]);
    const yaExisten = parseInt(existenResult.rows[0].count) > 0;

    if (yaExisten) {
      console.log(`Ya existen cuotas para el período ${periodo}, saltando generación automática`);
      return;
    }

    // Obtener todos los inmuebles activos con sus propietarios
    // Nota: Esta query asume que existe una tabla de inmuebles con usuarios
    // Adaptar según el esquema de base de datos real
    const inmueblesQuery = `
      SELECT DISTINCT 
        i.inmueble_id,
        i.usuario_id,
        i.monto_cuota_mensual,
        i.dia_vencimiento
      FROM inmuebles i
      WHERE i.activo = true
        AND i.usuario_id IS NOT NULL
        AND i.monto_cuota_mensual > 0
    `;

    const inmueblesResult = await query(inmueblesQuery);
    
    if (inmueblesResult.rows.length === 0) {
      console.log('No se encontraron inmuebles activos para generar cuotas');
      return;
    }

    console.log(`Encontrados ${inmueblesResult.rows.length} inmuebles para generar cuotas`);

    const cuotasCreadas = [];
    
    // Calcular fecha de vencimiento (día configurado del mes actual)
    const diaVencimientoDefault = 15; // Día por defecto si no está configurado
    
    for (const inmueble of inmueblesResult.rows) {
      const diaVencimiento = inmueble.dia_vencimiento || diaVencimientoDefault;
      const fechaVencimiento = new Date(now.getFullYear(), now.getMonth(), diaVencimiento);
      
      // Si el día ya pasó en el mes actual, programar para el próximo mes
      if (fechaVencimiento < now) {
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
      }

      const cuotaId = uuidv4();
      
      const insertQuery = `
        INSERT INTO cuotas (
          cuota_id, usuario_id, inmueble_id, periodo, monto, 
          fecha_vencimiento, estado, fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', NOW())
        RETURNING *
      `;

      const values = [
        cuotaId,
        inmueble.usuario_id,
        inmueble.inmueble_id,
        periodo,
        inmueble.monto_cuota_mensual,
        fechaVencimiento
      ];

      try {
        const result = await query(insertQuery, values);
        cuotasCreadas.push(result.rows[0]);

        // Publicar evento de cuota creada automáticamente
        await eventService.publishCuotaCreada({
          cuotaId: result.rows[0].cuota_id,
          usuarioId: result.rows[0].usuario_id,
          inmuebleId: result.rows[0].inmueble_id,
          monto: parseFloat(result.rows[0].monto),
          periodo: result.rows[0].periodo,
          fechaVencimiento: result.rows[0].fecha_vencimiento.toISOString(),
          generacionAutomatica: true
        });

      } catch (error) {
        console.error(`Error creando cuota automática para inmueble ${inmueble.inmueble_id}:`, error);
      }
    }

    console.log(`✅ Generación automática completada: ${cuotasCreadas.length} cuotas creadas para el período ${periodo}`);

    // Publicar evento resumen de generación masiva
    await eventService.publishGeneracionMasiva({
      periodo,
      totalCuotasGeneradas: cuotasCreadas.length,
      montoTotal: cuotasCreadas.reduce((sum, cuota) => sum + parseFloat(cuota.monto), 0),
      fechaGeneracion: new Date().toISOString(),
      tipoGeneracion: 'automatica'
    });

  } catch (error) {
    console.error('Error en generación automática de cuotas mensuales:', error);
    throw error;
  }
}; 