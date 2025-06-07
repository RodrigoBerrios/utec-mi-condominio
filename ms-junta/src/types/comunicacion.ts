import { z } from 'zod';

export const CreateComunicacionSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  tipo: z.enum(['informativa', 'urgente', 'convocatoria']),
  destinatarios: z.array(z.string()).min(1, 'Debe haber al menos un destinatario')
});

export const ComunicacionSchema = z.object({
  comunicacionId: z.string(),
  titulo: z.string(),
  contenido: z.string(),
  tipo: z.enum(['informativa', 'urgente', 'convocatoria']),
  fechaCreacion: z.date(),
  fechaEnvio: z.date().nullable(),
  estado: z.enum(['borrador', 'enviada']),
  destinatarios: z.array(z.string()),
  leida: z.boolean()
});

export type CreateComunicacion = z.infer<typeof CreateComunicacionSchema>;
export type Comunicacion = z.infer<typeof ComunicacionSchema>; 