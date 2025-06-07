import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Gasto, CreateGasto } from '../types/gasto';

export class GastoService {
  async create(gastoData: CreateGasto): Promise<Gasto> {
    const gastoId = uuidv4();
    const fecha = new Date();

    const sql = `
      INSERT INTO gastos (gasto_id, categoria, monto, fecha, descripcion, responsable, url_comprobante)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      gastoId,
      gastoData.categoria,
      gastoData.monto,
      fecha,
      gastoData.descripcion,
      gastoData.responsable,
      gastoData.urlComprobante || null
    ];

    const result = await query(sql, values);
    return this.mapDbToGasto(result.rows[0]);
  }

  async findAll(categoria?: string, fechaInicio?: string, fechaFin?: string): Promise<Gasto[]> {
    let sql = 'SELECT * FROM gastos WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (categoria) {
      sql += ` AND categoria = $${paramIndex}`;
      values.push(categoria);
      paramIndex++;
    }

    if (fechaInicio) {
      sql += ` AND fecha >= $${paramIndex}`;
      values.push(fechaInicio);
      paramIndex++;
    }

    if (fechaFin) {
      sql += ` AND fecha <= $${paramIndex}`;
      values.push(fechaFin);
      paramIndex++;
    }

    sql += ' ORDER BY fecha DESC';

    const result = await query(sql, values);
    return result.rows.map(row => this.mapDbToGasto(row));
  }

  async findById(gastoId: string): Promise<Gasto | null> {
    const sql = 'SELECT * FROM gastos WHERE gasto_id = $1';
    const result = await query(sql, [gastoId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToGasto(result.rows[0]);
  }

  async updateComprobante(gastoId: string, urlComprobante: string): Promise<Gasto | null> {
    const sql = `
      UPDATE gastos 
      SET url_comprobante = $1 
      WHERE gasto_id = $2 
      RETURNING *
    `;

    const result = await query(sql, [urlComprobante, gastoId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbToGasto(result.rows[0]);
  }

  private mapDbToGasto(row: any): Gasto {
    return {
      gastoId: row.gasto_id,
      categoria: row.categoria,
      monto: parseFloat(row.monto),
      fecha: new Date(row.fecha),
      descripcion: row.descripcion,
      responsable: row.responsable,
      urlComprobante: row.url_comprobante
    };
  }
} 