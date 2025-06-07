import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Aprobacion, CreateAprobacion } from '../types/aprobacion';

export class AprobacionService {
  async create(aprobacionData: CreateAprobacion): Promise<Aprobacion> {
    const aprobacionId = uuidv4();
    const fechaCreacion = new Date();
    const fechaLimite = new Date(aprobacionData.fechaLimite);

    const sql = `
      INSERT INTO aprobaciones_extraordinarias (
        aprobacion_id, tipo, descripcion, monto, fecha_creacion, 
        fecha_limite, estado, requiere_votacion, votos_a_favor, 
        votos_en_contra, abstenciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      aprobacionId,
      aprobacionData.tipo,
      aprobacionData.descripcion,
      aprobacionData.monto || null,
      fechaCreacion,
      fechaLimite,
      'pendiente',
      aprobacionData.requiereVotacion,
      0,
      0,
      0
    ];

    const result = await query(sql, values);
    return this.mapDbToAprobacion(result.rows[0]);
  }

  async findAll(estado?: string): Promise<Aprobacion[]> {
    let sql = 'SELECT * FROM aprobaciones_extraordinarias WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (estado) {
      sql += ` AND estado = $${paramIndex}`;
      values.push(estado);
      paramIndex++;
    }

    sql += ' ORDER BY fecha_creacion DESC';

    const result = await query(sql, values);
    return result.rows.map(row => this.mapDbToAprobacion(row));
  }

  private mapDbToAprobacion(row: any): Aprobacion {
    return {
      aprobacionId: row.aprobacion_id,
      tipo: row.tipo,
      descripcion: row.descripcion,
      monto: row.monto ? parseFloat(row.monto) : null,
      fechaCreacion: new Date(row.fecha_creacion),
      fechaLimite: new Date(row.fecha_limite),
      estado: row.estado,
      requiereVotacion: row.requiere_votacion,
      votosAFavor: parseInt(row.votos_a_favor),
      votosEnContra: parseInt(row.votos_en_contra),
      abstenciones: parseInt(row.abstenciones)
    };
  }
} 