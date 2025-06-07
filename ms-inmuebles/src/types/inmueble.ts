import { z } from 'zod';

export const InmuebleSchema = z.object({
  inmuebleId: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  tipo: z.enum(['edificio', 'condominio']),
  juntaId: z.string().optional(),
  fechaRegistro: z.date(),
});

export const CreateInmuebleSchema = InmuebleSchema.omit({
  inmuebleId: true,
  fechaRegistro: true,
});

export type Inmueble = z.infer<typeof InmuebleSchema>;
export type CreateInmueble = z.infer<typeof CreateInmuebleSchema>; 