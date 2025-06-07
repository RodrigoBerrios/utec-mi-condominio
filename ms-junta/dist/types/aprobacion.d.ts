import { z } from 'zod';
export declare const CreateAprobacionSchema: z.ZodObject<{
    tipo: z.ZodString;
    descripcion: z.ZodString;
    monto: z.ZodOptional<z.ZodNumber>;
    fechaLimite: z.ZodString;
    requiereVotacion: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tipo: string;
    descripcion: string;
    fechaLimite: string;
    requiereVotacion: boolean;
    monto?: number | undefined;
}, {
    tipo: string;
    descripcion: string;
    fechaLimite: string;
    monto?: number | undefined;
    requiereVotacion?: boolean | undefined;
}>;
export declare const AprobacionSchema: z.ZodObject<{
    aprobacionId: z.ZodString;
    tipo: z.ZodString;
    descripcion: z.ZodString;
    monto: z.ZodNullable<z.ZodNumber>;
    fechaCreacion: z.ZodDate;
    fechaLimite: z.ZodDate;
    estado: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
    requiereVotacion: z.ZodBoolean;
    votosAFavor: z.ZodNumber;
    votosEnContra: z.ZodNumber;
    abstenciones: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    tipo: string;
    descripcion: string;
    monto: number | null;
    fechaLimite: Date;
    requiereVotacion: boolean;
    aprobacionId: string;
    fechaCreacion: Date;
    estado: "pendiente" | "aprobada" | "rechazada";
    votosAFavor: number;
    votosEnContra: number;
    abstenciones: number;
}, {
    tipo: string;
    descripcion: string;
    monto: number | null;
    fechaLimite: Date;
    requiereVotacion: boolean;
    aprobacionId: string;
    fechaCreacion: Date;
    estado: "pendiente" | "aprobada" | "rechazada";
    votosAFavor: number;
    votosEnContra: number;
    abstenciones: number;
}>;
export type CreateAprobacion = z.infer<typeof CreateAprobacionSchema>;
export type Aprobacion = z.infer<typeof AprobacionSchema>;
