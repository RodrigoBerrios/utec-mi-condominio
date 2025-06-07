import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PresupuestoService } from '../services/presupuestoService';
import { successResponse, errorResponse } from '../utils/response';

const presupuestoService = new PresupuestoService();

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { periodo } = event.queryStringParameters || {};
    
    let resumen;
    
    if (periodo) {
      // Resumen para un periodo específico
      resumen = await presupuestoService.getResumenByPeriodo(periodo);
    } else {
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

    return successResponse({
      periodo: periodo || 'todos',
      resumen,
      totales,
      porcentajeEjecucion,
      estado: porcentajeEjecucion > 100 ? 'sobrepresupuesto' : 
              porcentajeEjecucion > 80 ? 'alerta' : 'normal'
    });
  } catch (error: any) {
    console.error('Error obteniendo resumen de gastos:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 