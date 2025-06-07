"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GastoService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
class GastoService {
    async create(gastoData) {
        const gastoId = (0, uuid_1.v4)();
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
        const result = await (0, database_1.query)(sql, values);
        return this.mapDbToGasto(result.rows[0]);
    }
    async findAll(categoria, fechaInicio, fechaFin) {
        let sql = 'SELECT * FROM gastos WHERE 1=1';
        const values = [];
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
        const result = await (0, database_1.query)(sql, values);
        return result.rows.map(row => this.mapDbToGasto(row));
    }
    async findById(gastoId) {
        const sql = 'SELECT * FROM gastos WHERE gasto_id = $1';
        const result = await (0, database_1.query)(sql, [gastoId]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapDbToGasto(result.rows[0]);
    }
    async updateComprobante(gastoId, urlComprobante) {
        const sql = `
      UPDATE gastos 
      SET url_comprobante = $1 
      WHERE gasto_id = $2 
      RETURNING *
    `;
        const result = await (0, database_1.query)(sql, [urlComprobante, gastoId]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapDbToGasto(result.rows[0]);
    }
    mapDbToGasto(row) {
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
exports.GastoService = GastoService;
