import { EventBridgeEvent } from 'aws-lambda';
interface CuotaVencidaDetail {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    monto: number;
    fechaVencimiento: string;
    diasVencido: number;
    timestamp: string;
}
interface RecordatorioPagoDetail {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    monto: number;
    fechaVencimiento: string;
    diasParaVencimiento: number;
    timestamp: string;
}
export declare const handleCuotaVencida: (event: EventBridgeEvent<"Cuota Vencida", CuotaVencidaDetail>) => Promise<void>;
export declare const handleRecordatorioPago: (event: EventBridgeEvent<"Recordatorio Pago", RecordatorioPagoDetail>) => Promise<void>;
export {};
//# sourceMappingURL=events.d.ts.map