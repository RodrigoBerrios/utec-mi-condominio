import { z } from 'zod';

export const JuntaSchema = z.object({
  juntaId: z.string(),
  inmuebleId: z.string(),
  miembros: z.array(z.string()),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de periodo inválido (YYYY-MM)'),
  estado: z.enum(['activa', 'inactiva']),
});

export const CreateJuntaSchema = JuntaSchema.omit({
  juntaId: true,
});

export type Junta = z.infer<typeof JuntaSchema>;
export type CreateJunta = z.infer<typeof CreateJuntaSchema>; 