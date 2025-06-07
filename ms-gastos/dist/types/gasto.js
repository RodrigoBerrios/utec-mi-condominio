"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GastoSchema = exports.CreateGastoSchema = void 0;
const zod_1 = require("zod");
exports.CreateGastoSchema = zod_1.z.object({
    categoria: zod_1.z.string().min(1, 'La categoría es requerida'),
    monto: zod_1.z.number().positive('El monto debe ser positivo'),
    descripcion: zod_1.z.string().min(1, 'La descripción es requerida'),
    responsable: zod_1.z.string().min(1, 'El responsable es requerido'),
    urlComprobante: zod_1.z.string().url().optional()
});
exports.GastoSchema = zod_1.z.object({
    gastoId: zod_1.z.string(),
    categoria: zod_1.z.string(),
    monto: zod_1.z.number(),
    fecha: zod_1.z.date(),
    descripcion: zod_1.z.string(),
    responsable: zod_1.z.string(),
    urlComprobante: zod_1.z.string().nullable()
});
