import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Pago, CreatePago, UpdateEstadoPago } from '../types/pago';

export class PagoService {
  async create(pagoData: CreatePago): Promise<Pago> {
    const pagoId = uuidv4();
    const fechaPago = new Date();

    const sql = `
      INSERT INTO pagos (
        pago_id, cuota_id, monto, fecha_pago, metodo_pago, 
        estado, referencia, observaciones, fecha_confirmacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      pagoId,
      pagoData.cuotaId,
      pagoData.monto,
      fechaPago,
      pagoData.metodoPago,
      'pendiente',
      pagoData.referencia || null,
      pagoData.observaciones || null,
      null
    ];

    const result = await query(sql, values);
    return this.mapDbToPago(result.rows[0]);
  }

  async findAll(cuotaId?: string, estado?: string): Promise<Pago[]> {
    let sql = 'SELECT * FROM pagos WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (cuotaId) {
      sql += ` AND cuota_id = $${paramIndex}`;
      values.push(cuotaId);
      paramIndex++;
    }

    if (estado) {
      sql += ` AND estado = $${paramIndex}`;
      values.push(estado);
      paramIndex++;
    }

    sql += ' ORDER BY fecha_pago DESC';

    const result = await query(sql, values);
    return result.rows.map(row => this.mapDbToPago(row));
  }

  async findById(pagoId: string): Promise<Pago | null> {
    const sql = 'SELECT * FROM pagos WHERE pago_id = $1';
    const result = await query(sql, [pagoId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToPago(result.rows[0]);
  }

  async updateEstado(pagoId: string, updateData: UpdateEstadoPago): Promise<Pago | null> {
    const fechaConfirmacion = updateData.estado === 'confirmado' ? new Date() : null;
    
    const sql = `
      UPDATE pagos 
      SET estado = $1, observaciones = $2, fecha_confirmacion = $3
      WHERE pago_id = $4 
      RETURNING *
    `;

    const values = [
      updateData.estado,
      updateData.observaciones || null,
      fechaConfirmacion,
      pagoId
    ];

    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToPago(result.rows[0]);
  }

  private mapDbToPago(row: any): Pago {
    return {
      pagoId: row.pago_id,
      cuotaId: row.cuota_id,
      monto: parseFloat(row.monto),
      fechaPago: new Date(row.fecha_pago),
      metodoPago: row.metodo_pago,
      estado: row.estado,
      referencia: row.referencia,
      observaciones: row.observaciones,
      fechaConfirmacion: row.fecha_confirmacion ? new Date(row.fecha_confirmacion) : null
    };
  }
} 