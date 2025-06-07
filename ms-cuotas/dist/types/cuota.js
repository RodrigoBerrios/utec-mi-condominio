"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoCuentaSchema = exports.CreateCuotaSchema = exports.CuotaSchema = void 0;
const zod_1 = require("zod");
exports.CuotaSchema = zod_1.z.object({
    cuotaId: zod_1.z.string(),
    usuarioId: zod_1.z.string(),
    inmuebleId: zod_1.z.string(),
    periodo: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Formato de periodo inválido (YYYY-MM)'),
    monto: zod_1.z.number().positive('El monto debe ser positivo'),
    fechaVencimiento: zod_1.z.date(),
    fechaPago: zod_1.z.date().optional(),
    estado: zod_1.z.enum(['pendiente', 'pagado', 'vencido']),
    fechaCreacion: zod_1.z.date(),
});
exports.CreateCuotaSchema = exports.CuotaSchema.omit({
    cuotaId: true,
    fechaCreacion: true,
    estado: true,
});
exports.EstadoCuentaSchema = zod_1.z.object({
    usuarioId: zod_1.z.string(),
    totalPendiente: zod_1.z.number(),
    totalPagado: zod_1.z.number(),
    cuotasVencidas: zod_1.z.number(),
    ultimoPago: zod_1.z.date().optional(),
    cuotas: zod_1.z.array(exports.CuotaSchema),
});
//# sourceMappingURL=cuota.js.map