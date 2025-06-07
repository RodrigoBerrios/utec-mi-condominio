import { z } from 'zod';

export const CreateAprobacionSchema = z.object({
  tipo: z.string().min(1, 'El tipo es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser positivo').optional(),
  fechaLimite: z.string().min(1, 'La fecha límite es requerida'),
  requiereVotacion: z.boolean().default(true)
});

export const AprobacionSchema = z.object({
  aprobacionId: z.string(),
  tipo: z.string(),
  descripcion: z.string(),
  monto: z.number().nullable(),
  fechaCreacion: z.date(),
  fechaLimite: z.date(),
  estado: z.enum(['pendiente', 'aprobada', 'rechazada']),
  requiereVotacion: z.boolean(),
  votosAFavor: z.number(),
  votosEnContra: z.number(),
  abstenciones: z.number()
});

export type CreateAprobacion = z.infer<typeof CreateAprobacionSchema>;
export type Aprobacion = z.infer<typeof AprobacionSchema>; 