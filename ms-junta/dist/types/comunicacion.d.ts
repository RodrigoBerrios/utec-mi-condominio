import { z } from 'zod';
export declare const CreateComunicacionSchema: z.ZodObject<{
    titulo: z.ZodString;
    contenido: z.ZodString;
    tipo: z.ZodEnum<["informativa", "urgente", "convocatoria"]>;
    destinatarios: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    tipo: "informativa" | "urgente" | "convocatoria";
    titulo: string;
    contenido: string;
    destinatarios: string[];
}, {
    tipo: "informativa" | "urgente" | "convocatoria";
    titulo: string;
    contenido: string;
    destinatarios: string[];
}>;
export declare const ComunicacionSchema: z.ZodObject<{
    comunicacionId: z.ZodString;
    titulo: z.ZodString;
    contenido: z.ZodString;
    tipo: z.ZodEnum<["informativa", "urgente", "convocatoria"]>;
    fechaCreacion: z.ZodDate;
    fechaEnvio: z.ZodNullable<z.ZodDate>;
    estado: z.ZodEnum<["borrador", "enviada"]>;
    destinatarios: z.ZodArray<z.ZodString, "many">;
    leida: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    tipo: "informativa" | "urgente" | "convocatoria";
    fechaCreacion: Date;
    estado: "borrador" | "enviada";
    titulo: string;
    contenido: string;
    destinatarios: string[];
    comunicacionId: string;
    fechaEnvio: Date | null;
    leida: boolean;
}, {
    tipo: "informativa" | "urgente" | "convocatoria";
    fechaCreacion: Date;
    estado: "borrador" | "enviada";
    titulo: string;
    contenido: string;
    destinatarios: string[];
    comunicacionId: string;
    fechaEnvio: Date | null;
    leida: boolean;
}>;
export type CreateComunicacion = z.infer<typeof CreateComunicacionSchema>;
export type Comunicacion = z.infer<typeof ComunicacionSchema>;
