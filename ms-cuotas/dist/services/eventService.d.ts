export declare class EventService {
    private readonly eventBusName;
    publishCuotaVencida(cuotaData: {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        monto: number;
        fechaVencimiento: string;
        diasVencido: number;
    }): Promise<void>;
    publishRecordatorioPago(cuotaData: {
        cuotaId: string;
        usuarioId: string;
        inmuebleId: string;
        monto: number;
        fechaVencimiento: string;
        diasParaVencimiento: number;
    }): Promise<void>;
}
//# sourceMappingURL=eventService.d.ts.map