import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Junta, CreateJunta } from '../types/junta';

export class JuntaService {
  async create(juntaData: CreateJunta): Promise<Junta> {
    const juntaId = uuidv4();

    const sql = `
      INSERT INTO juntas (junta_id, inmueble_id, miembros, periodo, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      juntaId,
      juntaData.inmuebleId,
      JSON.stringify(juntaData.miembros),
      juntaData.periodo,
      juntaData.estado
    ];

    const result = await query(sql, values);
    return this.mapDbToJunta(result.rows[0]);
  }

  async findAll(): Promise<Junta[]> {
    const sql = 'SELECT * FROM juntas ORDER BY periodo DESC';
    const result = await query(sql);
    return result.rows.map(row => this.mapDbToJunta(row));
  }

  async findById(juntaId: string): Promise<Junta | null> {
    const sql = 'SELECT * FROM juntas WHERE junta_id = $1';
    const result = await query(sql, [juntaId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToJunta(result.rows[0]);
  }

  async findByInmueble(inmuebleId: string): Promise<Junta[]> {
    const sql = 'SELECT * FROM juntas WHERE inmueble_id = $1 ORDER BY periodo DESC';
    const result = await query(sql, [inmuebleId]);
    return result.rows.map(row => this.mapDbToJunta(row));
  }

  private mapDbToJunta(row: any): Junta {
    return {
      juntaId: row.junta_id,
      inmuebleId: row.inmueble_id,
      miembros: JSON.parse(row.miembros),
      periodo: row.periodo,
      estado: row.estado
    };
  }
} 