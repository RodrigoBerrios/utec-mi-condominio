import { EventBridgeEvent } from 'aws-lambda';
import { NotificacionService } from '../services/notificacionService';

const notificacionService = new NotificacionService();

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

export const handleCuotaVencida = async (
  event: EventBridgeEvent<'Cuota Vencida', CuotaVencidaDetail>
): Promise<void> => {
  console.log('Procesando evento de cuota vencida:', JSON.stringify(event, null, 2));

  try {
    const { cuotaId, usuarioId, monto, diasVencido } = event.detail;

    // Crear notificación de cuota vencida
    await notificacionService.create({
      tipo: 'email',
      destinatario: usuarioId, // Se asume que el usuarioId es el email o se puede resolver
      asunto: `Cuota Vencida - ${diasVencido} días de retraso`,
      mensaje: `Su cuota mensual de $${monto} está vencida desde hace ${diasVencido} días. 
                Por favor, realice el pago lo antes posible para evitar recargos adicionales.
                ID de Cuota: ${cuotaId}`,
      metadata: {
        cuotaId,
        usuarioId,
        monto,
        diasVencido,
        tipo: 'cuota_vencida'
      }
    });

    console.log(`Notificación de cuota vencida creada para usuario ${usuarioId}`);
  } catch (error) {
    console.error('Error procesando evento de cuota vencida:', error);
    throw error;
  }
};

export const handleRecordatorioPago = async (
  event: EventBridgeEvent<'Recordatorio Pago', RecordatorioPagoDetail>
): Promise<void> => {
  console.log('Procesando evento de recordatorio de pago:', JSON.stringify(event, null, 2));

  try {
    const { cuotaId, usuarioId, monto, diasParaVencimiento } = event.detail;

    // Crear notificación de recordatorio
    await notificacionService.create({
      tipo: 'email',
      destinatario: usuarioId,
      asunto: `Recordatorio de Pago - Vence en ${diasParaVencimiento} días`,
      mensaje: `Le recordamos que su cuota mensual de $${monto} vence en ${diasParaVencimiento} días.
                Para evitar recargos, realice el pago antes de la fecha de vencimiento.
                ID de Cuota: ${cuotaId}`,
      metadata: {
        cuotaId,
        usuarioId,
        monto,
        diasParaVencimiento,
        tipo: 'recordatorio_pago'
      }
    });

    console.log(`Notificación de recordatorio creada para usuario ${usuarioId}`);
  } catch (error) {
    console.error('Error procesando evento de recordatorio de pago:', error);
    throw error;
  }
}; 