"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AprobacionService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
class AprobacionService {
    async create(aprobacionData) {
        const aprobacionId = (0, uuid_1.v4)();
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
        const result = await (0, database_1.query)(sql, values);
        return this.mapDbToAprobacion(result.rows[0]);
    }
    async findAll(estado) {
        let sql = 'SELECT * FROM aprobaciones_extraordinarias WHERE 1=1';
        const values = [];
        let paramIndex = 1;
        if (estado) {
            sql += ` AND estado = $${paramIndex}`;
            values.push(estado);
            paramIndex++;
        }
        sql += ' ORDER BY fecha_creacion DESC';
        const result = await (0, database_1.query)(sql, values);
        return result.rows.map(row => this.mapDbToAprobacion(row));
    }
    mapDbToAprobacion(row) {
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
exports.AprobacionService = AprobacionService;
