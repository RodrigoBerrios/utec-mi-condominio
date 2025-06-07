import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Comunicacion, CreateComunicacion } from '../types/comunicacion';

export class ComunicacionService {
  async create(comunicacionData: CreateComunicacion): Promise<Comunicacion> {
    const comunicacionId = uuidv4();
    const fechaCreacion = new Date();

    const sql = `
      INSERT INTO comunicaciones_junta (
        comunicacion_id, titulo, contenido, tipo, fecha_creacion, 
        fecha_envio, estado, destinatarios, leida
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      comunicacionId,
      comunicacionData.titulo,
      comunicacionData.contenido,
      comunicacionData.tipo,
      fechaCreacion,
      null, // fecha_envio
      'borrador',
      JSON.stringify(comunicacionData.destinatarios),
      false
    ];

    const result = await query(sql, values);
    return this.mapDbToComunicacion(result.rows[0]);
  }

  async findAll(tipo?: string, estado?: string): Promise<Comunicacion[]> {
    let sql = 'SELECT * FROM comunicaciones_junta WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (tipo) {
      sql += ` AND tipo = $${paramIndex}`;
      values.push(tipo);
      paramIndex++;
    }

    if (estado) {
      sql += ` AND estado = $${paramIndex}`;
      values.push(estado);
      paramIndex++;
    }

    sql += ' ORDER BY fecha_creacion DESC';

    const result = await query(sql, values);
    return result.rows.map(row => this.mapDbToComunicacion(row));
  }

  async findById(comunicacionId: string): Promise<Comunicacion | null> {
    const sql = 'SELECT * FROM comunicaciones_junta WHERE comunicacion_id = $1';
    const result = await query(sql, [comunicacionId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToComunicacion(result.rows[0]);
  }

  async enviar(comunicacionId: string): Promise<Comunicacion | null> {
    const fechaEnvio = new Date();
    
    const sql = `
      UPDATE comunicaciones_junta 
      SET estado = 'enviada', fecha_envio = $1 
      WHERE comunicacion_id = $2 
      RETURNING *
    `;

    const result = await query(sql, [fechaEnvio, comunicacionId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToComunicacion(result.rows[0]);
  }

  private mapDbToComunicacion(row: any): Comunicacion {
    return {
      comunicacionId: row.comunicacion_id,
      titulo: row.titulo,
      contenido: row.contenido,
      tipo: row.tipo,
      fechaCreacion: new Date(row.fecha_creacion),
      fechaEnvio: row.fecha_envio ? new Date(row.fecha_envio) : null,
      estado: row.estado,
      destinatarios: JSON.parse(row.destinatarios),
      leida: row.leida
    };
  }
} 