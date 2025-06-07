"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AprobacionSchema = exports.CreateAprobacionSchema = void 0;
const zod_1 = require("zod");
exports.CreateAprobacionSchema = zod_1.z.object({
    tipo: zod_1.z.string().min(1, 'El tipo es requerido'),
    descripcion: zod_1.z.string().min(1, 'La descripción es requerida'),
    monto: zod_1.z.number().positive('El monto debe ser positivo').optional(),
    fechaLimite: zod_1.z.string().min(1, 'La fecha límite es requerida'),
    requiereVotacion: zod_1.z.boolean().default(true)
});
exports.AprobacionSchema = zod_1.z.object({
    aprobacionId: zod_1.z.string(),
    tipo: zod_1.z.string(),
    descripcion: zod_1.z.string(),
    monto: zod_1.z.number().nullable(),
    fechaCreacion: zod_1.z.date(),
    fechaLimite: zod_1.z.date(),
    estado: zod_1.z.enum(['pendiente', 'aprobada', 'rechazada']),
    requiereVotacion: zod_1.z.boolean(),
    votosAFavor: zod_1.z.number(),
    votosEnContra: zod_1.z.number(),
    abstenciones: zod_1.z.number()
});
