import { z } from 'zod';

export const CreatePresupuestoSchema = z.object({
  periodo: z.string().min(1, 'El periodo es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  montoPresupuestado: z.number().positive('El monto presupuestado debe ser positivo')
});

export const PresupuestoSchema = z.object({
  periodo: z.string(),
  categoria: z.string(),
  montoPresupuestado: z.number(),
  montoEjecutado: z.number(),
  diferencia: z.number()
});

export type CreatePresupuesto = z.infer<typeof CreatePresupuestoSchema>;
export type Presupuesto = z.infer<typeof PresupuestoSchema>; 