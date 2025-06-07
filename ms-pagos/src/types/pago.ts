import { z } from 'zod';

export const CreatePagoSchema = z.object({
  cuotaId: z.string().min(1, 'El ID de cuota es requerido'),
  monto: z.number().positive('El monto debe ser positivo'),
  metodoPago: z.enum(['transferencia', 'efectivo', 'cheque', 'tarjeta']),
  referencia: z.string().optional(),
  observaciones: z.string().optional()
});

export const PagoSchema = z.object({
  pagoId: z.string(),
  cuotaId: z.string(),
  monto: z.number(),
  fechaPago: z.date(),
  metodoPago: z.enum(['transferencia', 'efectivo', 'cheque', 'tarjeta']),
  estado: z.enum(['pendiente', 'confirmado', 'rechazado']),
  referencia: z.string().nullable(),
  observaciones: z.string().nullable(),
  fechaConfirmacion: z.date().nullable()
});

export const UpdateEstadoPagoSchema = z.object({
  estado: z.enum(['pendiente', 'confirmado', 'rechazado']),
  observaciones: z.string().optional()
});

export type CreatePago = z.infer<typeof CreatePagoSchema>;
export type Pago = z.infer<typeof PagoSchema>;
export type UpdateEstadoPago = z.infer<typeof UpdateEstadoPagoSchema>; 