import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export class EventService {
  private readonly eventBusName = process.env.EVENTBRIDGE_BUS || 'condominio-events';

  async publishCuotaVencida(cuotaData: {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    monto: number;
    fechaVencimiento: string;
    diasVencido: number;
  }): Promise<void> {
    const command = new PutEventsCommand({
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
    } catch (error) {
      console.error('Error enviando evento de cuota vencida:', error);
      throw error;
    }
  }

  async publishRecordatorioPago(cuotaData: {
    cuotaId: string;
    usuarioId: string;
    inmuebleId: string;
    monto: number;
    fechaVencimiento: string;
    diasParaVencimiento: number;
  }): Promise<void> {
    const command = new PutEventsCommand({
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
    } catch (error) {
      console.error('Error enviando evento de recordatorio de pago:', error);
      throw error;
    }
  }
} 