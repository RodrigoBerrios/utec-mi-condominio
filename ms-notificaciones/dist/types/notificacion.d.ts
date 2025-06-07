import { z } from 'zod';
export declare const NotificacionSchema: z.ZodObject<{
    notificacionId: z.ZodString;
    tipo: z.ZodEnum<["email", "sms", "push"]>;
    destinatario: z.ZodString;
    asunto: z.ZodString;
    mensaje: z.ZodString;
    estado: z.ZodEnum<["pendiente", "enviado", "fallido"]>;
    fechaCreacion: z.ZodString;
    fechaEnvio: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    notificacionId: string;
    tipo: "push" | "email" | "sms";
    destinatario: string;
    asunto: string;
    mensaje: string;
    estado: "pendiente" | "enviado" | "fallido";
    fechaCreacion: string;
    metadata?: Record<string, any> | undefined;
    fechaEnvio?: string | undefined;
}, {
    notificacionId: string;
    tipo: "push" | "email" | "sms";
    destinatario: string;
    asunto: string;
    mensaje: string;
    estado: "pendiente" | "enviado" | "fallido";
    fechaCreacion: string;
    metadata?: Record<string, any> | undefined;
    fechaEnvio?: string | undefined;
}>;
export declare const CreateNotificacionSchema: z.ZodObject<Omit<{
    notificacionId: z.ZodString;
    tipo: z.ZodEnum<["email", "sms", "push"]>;
    destinatario: z.ZodString;
    asunto: z.ZodString;
    mensaje: z.ZodString;
    estado: z.ZodEnum<["pendiente", "enviado", "fallido"]>;
    fechaCreacion: z.ZodString;
    fechaEnvio: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "notificacionId" | "estado" | "fechaCreacion">, "strip", z.ZodTypeAny, {
    tipo: "push" | "email" | "sms";
    destinatario: string;
    asunto: string;
    mensaje: string;
    metadata?: Record<string, any> | undefined;
    fechaEnvio?: string | undefined;
}, {
    tipo: "push" | "email" | "sms";
    destinatario: string;
    asunto: string;
    mensaje: string;
    metadata?: Record<string, any> | undefined;
    fechaEnvio?: string | undefined;
}>;
export declare const NotificacionAutomaticaSchema: z.ZodObject<{
    tipo: z.ZodEnum<["cuota_vencida", "recordatorio_pago", "comunicado_general"]>;
    configuracion: z.ZodObject<{
        diasAntes: z.ZodOptional<z.ZodNumber>;
        frecuencia: z.ZodOptional<z.ZodEnum<["diaria", "semanal", "mensual"]>>;
        activa: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        activa: boolean;
        diasAntes?: number | undefined;
        frecuencia?: "diaria" | "semanal" | "mensual" | undefined;
    }, {
        activa: boolean;
        diasAntes?: number | undefined;
        frecuencia?: "diaria" | "semanal" | "mensual" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    tipo: "cuota_vencida" | "recordatorio_pago" | "comunicado_general";
    configuracion: {
        activa: boolean;
        diasAntes?: number | undefined;
        frecuencia?: "diaria" | "semanal" | "mensual" | undefined;
    };
}, {
    tipo: "cuota_vencida" | "recordatorio_pago" | "comunicado_general";
    configuracion: {
        activa: boolean;
        diasAntes?: number | undefined;
        frecuencia?: "diaria" | "semanal" | "mensual" | undefined;
    };
}>;
export type Notificacion = z.infer<typeof NotificacionSchema>;
export type CreateNotificacion = z.infer<typeof CreateNotificacionSchema>;
export type NotificacionAutomatica = z.infer<typeof NotificacionAutomaticaSchema>;
//# sourceMappingURL=notificacion.d.ts.map