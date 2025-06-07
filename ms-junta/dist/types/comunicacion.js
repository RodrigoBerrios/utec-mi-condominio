"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComunicacionSchema = exports.CreateComunicacionSchema = void 0;
const zod_1 = require("zod");
exports.CreateComunicacionSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1, 'El título es requerido'),
    contenido: zod_1.z.string().min(1, 'El contenido es requerido'),
    tipo: zod_1.z.enum(['informativa', 'urgente', 'convocatoria']),
    destinatarios: zod_1.z.array(zod_1.z.string()).min(1, 'Debe haber al menos un destinatario')
});
exports.ComunicacionSchema = zod_1.z.object({
    comunicacionId: zod_1.z.string(),
    titulo: zod_1.z.string(),
    contenido: zod_1.z.string(),
    tipo: zod_1.z.enum(['informativa', 'urgente', 'convocatoria']),
    fechaCreacion: zod_1.z.date(),
    fechaEnvio: zod_1.z.date().nullable(),
    estado: zod_1.z.enum(['borrador', 'enviada']),
    destinatarios: zod_1.z.array(zod_1.z.string()),
    leida: zod_1.z.boolean()
});
