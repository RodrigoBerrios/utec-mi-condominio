"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionAutomaticaSchema = exports.CreateNotificacionSchema = exports.NotificacionSchema = void 0;
const zod_1 = require("zod");
exports.NotificacionSchema = zod_1.z.object({
    notificacionId: zod_1.z.string(),
    tipo: zod_1.z.enum(['email', 'sms', 'push']),
    destinatario: zod_1.z.string(),
    asunto: zod_1.z.string(),
    mensaje: zod_1.z.string(),
    estado: zod_1.z.enum(['pendiente', 'enviado', 'fallido']),
    fechaCreacion: zod_1.z.string(),
    fechaEnvio: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.CreateNotificacionSchema = exports.NotificacionSchema.omit({
    notificacionId: true,
    fechaCreacion: true,
    estado: true,
});
exports.NotificacionAutomaticaSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['cuota_vencida', 'recordatorio_pago', 'comunicado_general']),
    configuracion: zod_1.z.object({
        diasAntes: zod_1.z.number().optional(),
        frecuencia: zod_1.z.enum(['diaria', 'semanal', 'mensual']).optional(),
        activa: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=notificacion.js.map