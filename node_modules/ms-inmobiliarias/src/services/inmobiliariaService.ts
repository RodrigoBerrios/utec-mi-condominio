import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Inmobiliaria, CreateInmobiliaria, UpdateInmobiliaria } from '../types/inmobiliaria';

export class InmobiliariaService {
  async create(inmobiliariaData: CreateInmobiliaria): Promise<Inmobiliaria> {
    const inmobiliariaId = uuidv4();
    const fechaRegistro = new Date();

    const sql = `
      INSERT INTO inmobiliarias (
        inmobiliaria_id, nombre, razon_social, ruc, direccion, 
        telefono, email, sitio_web, licencia, fecha_fundacion, 
        estado, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      inmobiliariaId,
      inmobiliariaData.nombre,
      inmobiliariaData.razonSocial,
      inmobiliariaData.ruc,
      inmobiliariaData.direccion,
      inmobiliariaData.telefono || null,
      inmobiliariaData.email || null,
      inmobiliariaData.sitioWeb || null,
      inmobiliariaData.licencia || null,
      inmobiliariaData.fechaFundacion || null,
      'activa',
      fechaRegistro
    ];

    const result = await query(sql, values);
    return this.mapDbToInmobiliaria(result.rows[0]);
  }

  async findAll(): Promise<Inmobiliaria[]> {
    const sql = 'SELECT * FROM inmobiliarias ORDER BY fecha_registro DESC';
    const result = await query(sql);
    return result.rows.map(row => this.mapDbToInmobiliaria(row));
  }

  async findById(inmobiliariaId: string): Promise<Inmobiliaria | null> {
    const sql = 'SELECT * FROM inmobiliarias WHERE inmobiliaria_id = $1';
    const result = await query(sql, [inmobiliariaId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToInmobiliaria(result.rows[0]);
  }

  async update(inmobiliariaId: string, updateData: UpdateInmobiliaria): Promise<Inmobiliaria | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbField = this.mapFieldToDb(key);
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.findById(inmobiliariaId);
    }

    values.push(inmobiliariaId);
    
    const sql = `
      UPDATE inmobiliarias 
      SET ${fields.join(', ')}
      WHERE inmobiliaria_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToInmobiliaria(result.rows[0]);
  }

  async delete(inmobiliariaId: string): Promise<boolean> {
    // Verificar si tiene inmuebles asociados
    const inmueblesSql = 'SELECT COUNT(*) as count FROM inmuebles WHERE inmobiliaria_id = $1';
    const inmueblesResult = await query(inmueblesSql, [inmobiliariaId]);
    
    if (parseInt(inmueblesResult.rows[0].count) > 0) {
      throw new Error('No se puede eliminar la inmobiliaria porque tiene inmuebles asociados');
    }

    const sql = 'DELETE FROM inmobiliarias WHERE inmobiliaria_id = $1';
    const result = await query(sql, [inmobiliariaId]);
    return (result.rowCount ?? 0) > 0;
  }

  async findInmuebles(inmobiliariaId: string): Promise<any[]> {
    const sql = `
      SELECT inmueble_id, nombre, direccion, tipo, fecha_registro
      FROM inmuebles 
      WHERE inmobiliaria_id = $1
      ORDER BY fecha_registro DESC
    `;
    const result = await query(sql, [inmobiliariaId]);
    return result.rows.map(row => ({
      inmuebleId: row.inmueble_id,
      nombre: row.nombre,
      direccion: row.direccion,
      tipo: row.tipo,
      fechaRegistro: new Date(row.fecha_registro)
    }));
  }

  private mapDbToInmobiliaria(row: any): Inmobiliaria {
    return {
      inmobiliariaId: row.inmobiliaria_id,
      nombre: row.nombre,
      razonSocial: row.razon_social,
      ruc: row.ruc,
      direccion: row.direccion,
      telefono: row.telefono,
      email: row.email,
      sitioWeb: row.sitio_web,
      licencia: row.licencia,
      fechaFundacion: row.fecha_fundacion ? new Date(row.fecha_fundacion) : undefined,
      estado: row.estado,
      fechaRegistro: new Date(row.fecha_registro)
    };
  }

  private mapFieldToDb(field: string): string {
    const fieldMap: Record<string, string> = {
      nombre: 'nombre',
      razonSocial: 'razon_social',
      ruc: 'ruc',
      direccion: 'direccion',
      telefono: 'telefono',
      email: 'email',
      sitioWeb: 'sitio_web',
      licencia: 'licencia',
      fechaFundacion: 'fecha_fundacion',
      estado: 'estado'
    };
    return fieldMap[field] || field;
  }
} 