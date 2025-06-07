"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresupuestoSchema = exports.CreatePresupuestoSchema = void 0;
const zod_1 = require("zod");
exports.CreatePresupuestoSchema = zod_1.z.object({
    periodo: zod_1.z.string().min(1, 'El periodo es requerido'),
    categoria: zod_1.z.string().min(1, 'La categoría es requerida'),
    montoPresupuestado: zod_1.z.number().positive('El monto presupuestado debe ser positivo')
});
exports.PresupuestoSchema = zod_1.z.object({
    periodo: zod_1.z.string(),
    categoria: zod_1.z.string(),
    montoPresupuestado: zod_1.z.number(),
    montoEjecutado: zod_1.z.number(),
    diferencia: zod_1.z.number()
});
