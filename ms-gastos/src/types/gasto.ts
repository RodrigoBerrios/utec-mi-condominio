import { z } from 'zod';

export const CreateGastoSchema = z.object({
  categoria: z.string().min(1, 'La categoría es requerida'),
  monto: z.number().positive('El monto debe ser positivo'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  responsable: z.string().min(1, 'El responsable es requerido'),
  urlComprobante: z.string().url().optional()
});

export const GastoSchema = z.object({
  gastoId: z.string(),
  categoria: z.string(),
  monto: z.number(),
  fecha: z.date(),
  descripcion: z.string(),
  responsable: z.string(),
  urlComprobante: z.string().nullable()
});

export type CreateGasto = z.infer<typeof CreateGastoSchema>;
export type Gasto = z.infer<typeof GastoSchema>; 