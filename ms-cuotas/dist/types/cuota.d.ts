import { z } from 'zod';
export declare const CuotaSchema: z.ZodObject<{
    cuotaId: z.ZodString;
    usuarioId: z.ZodString;
    inmuebleId: z.ZodString;
    periodo: z.ZodString;
    monto: z.ZodNumber;
    fechaVencimiento: z.ZodDate;
    fechaPago: z.ZodOptional<z.ZodDate>;
    estado: z.ZodEnum<["pendiente", "pagado", "vencido"]>;
    fechaCreacion: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    periodo: string;
    monto: number;
    fechaVencimiento: Date;
    estado: "pendiente" | "pagado" | "vencido";
    fechaCreacion: Date;
    fechaPago?: Date | undefined;
}, {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    periodo: string;
    monto: number;
    fechaVencimiento: Date;
    estado: "pendiente" | "pagado" | "vencido";
    fechaCreacion: Date;
    fechaPago?: Date | undefined;
}>;
export declare const CreateCuotaSchema: z.ZodObject<Omit<{
    cuotaId: z.ZodString;
    usuarioId: z.ZodString;
    inmuebleId: z.ZodString;
    periodo: z.ZodString;
    monto: z.ZodNumber;
    fechaVencimiento: z.ZodDate;
    fechaPago: z.ZodOptional<z.ZodDate>;
    estado: z.ZodEnum<["pendiente", "pagado", "vencido"]>;
    fechaCreacion: z.ZodDate;
}, "cuotaId" | "estado" | "fechaCreacion">, "strip", z.ZodTypeAny, {
    usuarioId: string;
    inmuebleId: string;
    periodo: string;
    monto: number;
    fechaVencimiento: Date;
    fechaPago?: Date | undefined;
}, {
    usuarioId: string;
    inmuebleId: string;
    periodo: string;
    monto: number;
    fechaVencimiento: Date;
    fechaPago?: Date | undefined;
}>;
export declare const EstadoCuentaSchema: z.ZodObject<{
    usuarioId: z.ZodString;
    totalPendiente: z.ZodNumber;
    totalPagado: z.ZodNumber;
    cuotasVencidas: z.ZodNumber;
    ultimoPago: z.ZodOptional<z.ZodDate>;
    cuotas: z.ZodArray<z.ZodObject<{
        cuotaId: z.ZodString;
        usuarioId: z.ZodString;
        inmuebleId: z.ZodString;
        periodo: z.ZodString;
        monto: z.ZodNumber;
        fechaVencimiento: z.ZodDate;
        fechaPago: z.ZodOptional<z.ZodDate>;
        estado: z.ZodEnum<["pendiente", "pagado", "vencido"]>;
        fechaCreacion: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        estado: "pendiente" | "pagado" | "vencido";
        fechaCreacion: Date;
        fechaPago?: Date | undefined;
    }, {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        estado: "pendiente" | "pagado" | "vencido";
        fechaCreacion: Date;
        fechaPago?: Date | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    usuarioId: string;
    totalPendiente: number;
    totalPagado: number;
    cuotasVencidas: number;
    cuotas: {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        estado: "pendiente" | "pagado" | "vencido";
        fechaCreacion: Date;
        fechaPago?: Date | undefined;
    }[];
    ultimoPago?: Date | undefined;
}, {
    usuarioId: string;
    totalPendiente: number;
    totalPagado: number;
    cuotasVencidas: number;
    cuotas: {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        periodo: string;
        monto: number;
        fechaVencimiento: Date;
        estado: "pendiente" | "pagado" | "vencido";
        fechaCreacion: Date;
        fechaPago?: Date | undefined;
    }[];
    ultimoPago?: Date | undefined;
}>;
export type Cuota = z.infer<typeof CuotaSchema>;
export type CreateCuota = z.infer<typeof CreateCuotaSchema>;
export type EstadoCuenta = z.infer<typeof EstadoCuentaSchema>;
//# sourceMappingURL=cuota.d.ts.map