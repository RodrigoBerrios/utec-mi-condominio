import { z } from 'zod';
export declare const CreatePresupuestoSchema: z.ZodObject<{
    periodo: z.ZodString;
    categoria: z.ZodString;
    montoPresupuestado: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    categoria: string;
    periodo: string;
    montoPresupuestado: number;
}, {
    categoria: string;
    periodo: string;
    montoPresupuestado: number;
}>;
export declare const PresupuestoSchema: z.ZodObject<{
    periodo: z.ZodString;
    categoria: z.ZodString;
    montoPresupuestado: z.ZodNumber;
    montoEjecutado: z.ZodNumber;
    diferencia: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    categoria: string;
    periodo: string;
    montoPresupuestado: number;
    montoEjecutado: number;
    diferencia: number;
}, {
    categoria: string;
    periodo: string;
    montoPresupuestado: number;
    montoEjecutado: number;
    diferencia: number;
}>;
export type CreatePresupuesto = z.infer<typeof CreatePresupuestoSchema>;
export type Presupuesto = z.infer<typeof PresupuestoSchema>;
