import { z } from 'zod';

export const CuotaSchema = z.object({
  cuotaId: z.string(),
  usuarioId: z.string(),
  inmuebleId: z.string(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de periodo inválido (YYYY-MM)'),
  monto: z.number().positive('El monto debe ser positivo'),
  fechaVencimiento: z.date(),
  fechaPago: z.date().optional(),
  estado: z.enum(['pendiente', 'pagado', 'vencido']),
  fechaCreacion: z.date(),
});

export const CreateCuotaSchema = CuotaSchema.omit({
  cuotaId: true,
  fechaCreacion: true,
  estado: true,
});

export const EstadoCuentaSchema = z.object({
  usuarioId: z.string(),
  totalPendiente: z.number(),
  totalPagado: z.number(),
  cuotasVencidas: z.number(),
  ultimoPago: z.date().optional(),
  cuotas: z.array(CuotaSchema),
});

export type Cuota = z.infer<typeof CuotaSchema>;
export type CreateCuota = z.infer<typeof CreateCuotaSchema>;
export type EstadoCuenta = z.infer<typeof EstadoCuentaSchema>; 