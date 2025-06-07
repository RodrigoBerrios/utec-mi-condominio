import { z } from 'zod';

export const NotificacionSchema = z.object({
  notificacionId: z.string(),
  tipo: z.enum(['email', 'sms', 'push']),
  destinatario: z.string(),
  asunto: z.string(),
  mensaje: z.string(),
  estado: z.enum(['pendiente', 'enviado', 'fallido']),
  fechaCreacion: z.string(),
  fechaEnvio: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const CreateNotificacionSchema = NotificacionSchema.omit({
  notificacionId: true,
  fechaCreacion: true,
  estado: true,
});

export const NotificacionAutomaticaSchema = z.object({
  tipo: z.enum(['cuota_vencida', 'recordatorio_pago', 'comunicado_general']),
  configuracion: z.object({
    diasAntes: z.number().optional(),
    frecuencia: z.enum(['diaria', 'semanal', 'mensual']).optional(),
    activa: z.boolean(),
  }),
});

export type Notificacion = z.infer<typeof NotificacionSchema>;
export type CreateNotificacion = z.infer<typeof CreateNotificacionSchema>;
export type NotificacionAutomatica = z.infer<typeof NotificacionAutomaticaSchema>; 