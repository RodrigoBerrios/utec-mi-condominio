"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCuotasVencidas = void 0;
const database_1 = require("../config/database");
const eventService_1 = require("../services/eventService");
const eventService = new eventService_1.EventService();
const checkCuotasVencidas = async (event) => {
    console.log('Iniciando verificación de cuotas vencidas...');
    try {
        // Buscar cuotas vencidas (fecha de vencimiento pasada y estado pendiente)
        const cuotasVencidasQuery = `
      SELECT 
        cuota_id,
        usuario_id,
        inmueble_id,
        monto,
        fecha_vencimiento,
        EXTRACT(DAY FROM NOW() - fecha_vencimiento) as dias_vencido
      FROM cuotas 
      WHERE fecha_vencimiento < NOW() 
        AND estado = 'pendiente'
        AND EXTRACT(DAY FROM NOW() - fecha_vencimiento) > 0
    `;
        const cuotasVencidas = await (0, database_1.query)(cuotasVencidasQuery);
        console.log(`Encontradas ${cuotasVencidas.rows.length} cuotas vencidas`);
        // Actualizar estado de cuotas vencidas
        if (cuotasVencidas.rows.length > 0) {
            const cuotaIds = cuotasVencidas.rows.map(row => row.cuota_id);
            const updateQuery = `
        UPDATE cuotas 
        SET estado = 'vencido' 
        WHERE cuota_id = ANY($1) AND estado = 'pendiente'
      `;
            await (0, database_1.query)(updateQuery, [cuotaIds]);
        }
        // Enviar eventos para cada cuota vencida
        for (const cuota of cuotasVencidas.rows) {
            await eventService.publishCuotaVencida({
                cuotaId: cuota.cuota_id,
                usuarioId: cuota.usuario_id,
                inmuebleId: cuota.inmueble_id,
                monto: parseFloat(cuota.monto),
                fechaVencimiento: cuota.fecha_vencimiento.toISOString(),
                diasVencido: parseInt(cuota.dias_vencido),
            });
        }
        // Buscar cuotas próximas a vencer (en los próximos 7 días)
        const cuotasProximasQuery = `
      SELECT 
        cuota_id,
        usuario_id,
        inmueble_id,
        monto,
        fecha_vencimiento,
        EXTRACT(DAY FROM fecha_vencimiento - NOW()) as dias_para_vencimiento
      FROM cuotas 
      WHERE fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND estado = 'pendiente'
    `;
        const cuotasProximas = await (0, database_1.query)(cuotasProximasQuery);
        console.log(`Encontradas ${cuotasProximas.rows.length} cuotas próximas a vencer`);
        // Enviar recordatorios para cuotas próximas a vencer
        for (const cuota of cuotasProximas.rows) {
            await eventService.publishRecordatorioPago({
                cuotaId: cuota.cuota_id,
                usuarioId: cuota.usuario_id,
                inmuebleId: cuota.inmueble_id,
                monto: parseFloat(cuota.monto),
                fechaVencimiento: cuota.fecha_vencimiento.toISOString(),
                diasParaVencimiento: parseInt(cuota.dias_para_vencimiento),
            });
        }
        console.log('Verificación de cuotas completada exitosamente');
    }
    catch (error) {
        console.error('Error en verificación de cuotas vencidas:', error);
        throw error;
    }
};
exports.checkCuotasVencidas = checkCuotasVencidas;
//# sourceMappingURL=cron.js.map