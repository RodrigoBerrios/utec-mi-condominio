import { z } from 'zod';
export declare const CreateGastoSchema: z.ZodObject<{
    categoria: z.ZodString;
    monto: z.ZodNumber;
    descripcion: z.ZodString;
    responsable: z.ZodString;
    urlComprobante: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    categoria: string;
    monto: number;
    descripcion: string;
    responsable: string;
    urlComprobante?: string | undefined;
}, {
    categoria: string;
    monto: number;
    descripcion: string;
    responsable: string;
    urlComprobante?: string | undefined;
}>;
export declare const GastoSchema: z.ZodObject<{
    gastoId: z.ZodString;
    categoria: z.ZodString;
    monto: z.ZodNumber;
    fecha: z.ZodDate;
    descripcion: z.ZodString;
    responsable: z.ZodString;
    urlComprobante: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    categoria: string;
    monto: number;
    descripcion: string;
    responsable: string;
    urlComprobante: string | null;
    gastoId: string;
    fecha: Date;
}, {
    categoria: string;
    monto: number;
    descripcion: string;
    responsable: string;
    urlComprobante: string | null;
    gastoId: string;
    fecha: Date;
}>;
export type CreateGasto = z.infer<typeof CreateGastoSchema>;
export type Gasto = z.infer<typeof GastoSchema>;
