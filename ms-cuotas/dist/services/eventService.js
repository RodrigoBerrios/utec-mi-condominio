"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
const eventBridge = new client_eventbridge_1.EventBridgeClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
class EventService {
    constructor() {
        this.eventBusName = process.env.EVENTBRIDGE_BUS || 'condominio-events';
    }
    async publishCuotaVencida(cuotaData) {
        const command = new client_eventbridge_1.PutEventsCommand({
            Entries: [
                {
                    Source: 'ms-cuotas',
                    DetailType: 'Cuota Vencida',
                    Detail: JSON.stringify({
                        cuotaId: cuotaData.cuotaId,
                        usuarioId: cuotaData.usuarioId,
                        inmuebleId: cuotaData.inmuebleId,
                        monto: cuotaData.monto,
                        fechaVencimiento: cuotaData.fechaVencimiento,
                        diasVencido: cuotaData.diasVencido,
                        timestamp: new Date().toISOString(),
                    }),
                    EventBusName: this.eventBusName,
                },
            ],
        });
        try {
            await eventBridge.send(command);
            console.log(`Evento de cuota vencida enviado para cuota ${cuotaData.cuotaId}`);
        }
        catch (error) {
            console.error('Error enviando evento de cuota vencida:', error);
            throw error;
        }
    }
    async publishRecordatorioPago(cuotaData) {
        const command = new client_eventbridge_1.PutEventsCommand({
            Entries: [
                {
                    Source: 'ms-cuotas',
                    DetailType: 'Recordatorio Pago',
                    Detail: JSON.stringify({
                        cuotaId: cuotaData.cuotaId,
                        usuarioId: cuotaData.usuarioId,
                        inmuebleId: cuotaData.inmuebleId,
                        monto: cuotaData.monto,
                        fechaVencimiento: cuotaData.fechaVencimiento,
                        diasParaVencimiento: cuotaData.diasParaVencimiento,
                        timestamp: new Date().toISOString(),
                    }),
                    EventBusName: this.eventBusName,
                },
            ],
        });
        try {
            await eventBridge.send(command);
            console.log(`Evento de recordatorio de pago enviado para cuota ${cuotaData.cuotaId}`);
        }
        catch (error) {
            console.error('Error enviando evento de recordatorio de pago:', error);
            throw error;
        }
    }
}
exports.EventService = EventService;
//# sourceMappingURL=eventService.js.map