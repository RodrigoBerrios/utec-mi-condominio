import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Inmueble, CreateInmueble } from '../types/inmueble';

export class InmuebleService {
  async create(inmuebleData: CreateInmueble): Promise<Inmueble> {
    const inmuebleId = uuidv4();
    const fechaRegistro = new Date();

    const sql = `
      INSERT INTO inmuebles (inmueble_id, nombre, direccion, tipo, junta_id, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      inmuebleId,
      inmuebleData.nombre,
      inmuebleData.direccion,
      inmuebleData.tipo,
      inmuebleData.juntaId || null,
      fechaRegistro
    ];

    const result = await query(sql, values);
    return this.mapDbToInmueble(result.rows[0]);
  }

  async findAll(): Promise<Inmueble[]> {
    const sql = 'SELECT * FROM inmuebles ORDER BY fecha_registro DESC';
    const result = await query(sql);
    return result.rows.map(row => this.mapDbToInmueble(row));
  }

  async findById(inmuebleId: string): Promise<Inmueble | null> {
    const sql = 'SELECT * FROM inmuebles WHERE inmueble_id = $1';
    const result = await query(sql, [inmuebleId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToInmueble(result.rows[0]);
  }

  private mapDbToInmueble(row: any): Inmueble {
    return {
      inmuebleId: row.inmueble_id,
      nombre: row.nombre,
      direccion: row.direccion,
      tipo: row.tipo,
      juntaId: row.junta_id,
      fechaRegistro: new Date(row.fecha_registro)
    };
  }
} 