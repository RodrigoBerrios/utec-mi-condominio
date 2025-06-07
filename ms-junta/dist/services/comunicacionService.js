"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComunicacionService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
class ComunicacionService {
    async create(comunicacionData) {
        const comunicacionId = (0, uuid_1.v4)();
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
        const result = await (0, database_1.query)(sql, values);
        return this.mapDbToComunicacion(result.rows[0]);
    }
    async findAll(tipo, estado) {
        let sql = 'SELECT * FROM comunicaciones_junta WHERE 1=1';
        const values = [];
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
        const result = await (0, database_1.query)(sql, values);
        return result.rows.map(row => this.mapDbToComunicacion(row));
    }
    async findById(comunicacionId) {
        const sql = 'SELECT * FROM comunicaciones_junta WHERE comunicacion_id = $1';
        const result = await (0, database_1.query)(sql, [comunicacionId]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapDbToComunicacion(result.rows[0]);
    }
    async enviar(comunicacionId) {
        const fechaEnvio = new Date();
        const sql = `
      UPDATE comunicaciones_junta 
      SET estado = 'enviada', fecha_envio = $1 
      WHERE comunicacion_id = $2 
      RETURNING *
    `;
        const result = await (0, database_1.query)(sql, [fechaEnvio, comunicacionId]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapDbToComunicacion(result.rows[0]);
    }
    mapDbToComunicacion(row) {
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
exports.ComunicacionService = ComunicacionService;
