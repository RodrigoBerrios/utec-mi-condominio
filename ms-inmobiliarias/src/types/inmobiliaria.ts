import { z } from 'zod';

export const InmobiliariaSchema = z.object({
  inmobiliariaId: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  ruc: z.string().length(11, 'El RUC debe tener 11 dígitos').regex(/^\d+$/, 'El RUC solo debe contener números'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  sitioWeb: z.string().url('URL inválida').optional(),
  licencia: z.string().optional(),
  fechaFundacion: z.date().optional(),
  estado: z.enum(['activa', 'inactiva', 'suspendida']),
  fechaRegistro: z.date(),
});

export const CreateInmobiliariaSchema = InmobiliariaSchema.omit({
  inmobiliariaId: true,
  fechaRegistro: true,
  estado: true,
});

export const UpdateInmobiliariaSchema = CreateInmobiliariaSchema.partial();

export type Inmobiliaria = z.infer<typeof InmobiliariaSchema>;
export type CreateInmobiliaria = z.infer<typeof CreateInmobiliariaSchema>;
export type UpdateInmobiliaria = z.infer<typeof UpdateInmobiliariaSchema>; 