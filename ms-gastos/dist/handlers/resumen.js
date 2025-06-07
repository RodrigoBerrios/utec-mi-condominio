"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const presupuestoService_1 = require("../services/presupuestoService");
const response_1 = require("../utils/response");
const presupuestoService = new presupuestoService_1.PresupuestoService();
const get = async (event) => {
    try {
        const { periodo } = event.queryStringParameters || {};
        let resumen;
        if (periodo) {
            // Resumen para un periodo específico
            resumen = await presupuestoService.getResumenByPeriodo(periodo);
        }
        else {
            // Resumen general de todos los periodos
            resumen = await presupuestoService.getResumenGeneral();
        }
        // Calcular totales
        const totales = resumen.reduce((acc, item) => {
            acc.totalPresupuestado += item.montoPresupuestado;
            acc.totalEjecutado += item.montoEjecutado;
            acc.totalDiferencia += item.diferencia;
            return acc;
        }, {
            totalPresupuestado: 0,
            totalEjecutado: 0,
            totalDiferencia: 0
        });
        // Calcular porcentaje de ejecución
        const porcentajeEjecucion = totales.totalPresupuestado > 0
            ? Math.round((totales.totalEjecutado / totales.totalPresupuestado) * 100)
            : 0;
        return (0, response_1.successResponse)({
            periodo: periodo || 'todos',
            resumen,
            totales,
            porcentajeEjecucion,
            estado: porcentajeEjecucion > 100 ? 'sobrepresupuesto' :
                porcentajeEjecucion > 80 ? 'alerta' : 'normal'
        });
    }
    catch (error) {
        console.error('Error obteniendo resumen de gastos:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.get = get;
