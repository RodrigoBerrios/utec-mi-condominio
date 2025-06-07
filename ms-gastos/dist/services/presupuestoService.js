"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresupuestoService = void 0;
const database_1 = require("../config/database");
class PresupuestoService {
    async getResumenByPeriodo(periodo) {
        const sql = `
      SELECT 
        p.periodo,
        p.categoria,
        p.monto_presupuestado,
        COALESCE(SUM(g.monto), 0) as monto_ejecutado,
        (p.monto_presupuestado - COALESCE(SUM(g.monto), 0)) as diferencia
      FROM presupuestos p
      LEFT JOIN gastos g ON p.categoria = g.categoria 
        AND TO_CHAR(g.fecha, 'YYYY-MM') = p.periodo
      WHERE p.periodo = $1
      GROUP BY p.periodo, p.categoria, p.monto_presupuestado
      ORDER BY p.categoria
    `;
        const result = await (0, database_1.query)(sql, [periodo]);
        return result.rows.map(row => this.mapDbToPresupuesto(row));
    }
    async getResumenGeneral() {
        const sql = `
      SELECT 
        p.periodo,
        p.categoria,
        p.monto_presupuestado,
        COALESCE(SUM(g.monto), 0) as monto_ejecutado,
        (p.monto_presupuestado - COALESCE(SUM(g.monto), 0)) as diferencia
      FROM presupuestos p
      LEFT JOIN gastos g ON p.categoria = g.categoria 
        AND TO_CHAR(g.fecha, 'YYYY-MM') = p.periodo
      GROUP BY p.periodo, p.categoria, p.monto_presupuestado
      ORDER BY p.periodo DESC, p.categoria
    `;
        const result = await (0, database_1.query)(sql);
        return result.rows.map(row => this.mapDbToPresupuesto(row));
    }
    async create(presupuestoData) {
        const sql = `
      INSERT INTO presupuestos (periodo, categoria, monto_presupuestado, monto_ejecutado, diferencia)
      VALUES ($1, $2, $3, 0, $3)
      ON CONFLICT (periodo, categoria) 
      DO UPDATE SET 
        monto_presupuestado = EXCLUDED.monto_presupuestado,
        diferencia = EXCLUDED.monto_presupuestado - presupuestos.monto_ejecutado
      RETURNING *
    `;
        const values = [
            presupuestoData.periodo,
            presupuestoData.categoria,
            presupuestoData.montoPresupuestado
        ];
        const result = await (0, database_1.query)(sql, values);
        return this.mapDbToPresupuesto(result.rows[0]);
    }
    mapDbToPresupuesto(row) {
        return {
            periodo: row.periodo,
            categoria: row.categoria,
            montoPresupuestado: parseFloat(row.monto_presupuestado),
            montoEjecutado: parseFloat(row.monto_ejecutado),
            diferencia: parseFloat(row.diferencia)
        };
    }
}
exports.PresupuestoService = PresupuestoService;
