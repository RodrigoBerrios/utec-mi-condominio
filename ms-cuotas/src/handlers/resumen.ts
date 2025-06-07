import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';

// Función helper para response
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
  },
  body: JSON.stringify(body)
});

// Obtener resumen general de cuotas
export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { queryStringParameters } = event;
    const periodo = queryStringParameters?.periodo;
    const fechaInicio = queryStringParameters?.fechaInicio;
    const fechaFin = queryStringParameters?.fechaFin;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Filtros opcionales
    if (periodo) {
      whereClause = ` WHERE periodo = $${paramIndex}`;
      params.push(periodo);
      paramIndex++;
    } else if (fechaInicio && fechaFin) {
      whereClause = ` WHERE fecha_creacion BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fechaInicio, fechaFin);
      paramIndex += 2;
    }

    // Resumen general
    const resumenQuery = `
      SELECT 
        COUNT(*) as total_cuotas,
        SUM(monto) as monto_total,
        SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as total_pagado,
        SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END) as total_pendiente,
        SUM(CASE WHEN estado = 'vencido' THEN monto ELSE 0 END) as total_vencido,
        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as cuotas_pagadas,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as cuotas_pendientes,
        COUNT(CASE WHEN estado = 'vencido' THEN 1 END) as cuotas_vencidas,
        AVG(monto) as monto_promedio
      FROM cuotas${whereClause}
    `;

    const resumenResult = await query(resumenQuery, params);
    const resumen = resumenResult.rows[0];

    // Resumen por período
    const resumenPeriodoQuery = `
      SELECT 
        periodo,
        COUNT(*) as total_cuotas,
        SUM(monto) as monto_total,
        SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as total_pagado,
        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as cuotas_pagadas,
        ROUND((COUNT(CASE WHEN estado = 'pagado' THEN 1 END) * 100.0 / COUNT(*)), 2) as porcentaje_pagado
      FROM cuotas${whereClause}
      GROUP BY periodo
      ORDER BY periodo DESC
      LIMIT 12
    `;

    const resumenPeriodoResult = await query(resumenPeriodoQuery, params);

    // Top usuarios con más cuotas vencidas
    const morosoQuery = `
      SELECT 
        usuario_id,
        COUNT(*) as cuotas_vencidas,
        SUM(monto) as monto_vencido
      FROM cuotas 
      WHERE estado = 'vencido'${periodo ? ` AND periodo = $${params.length + 1}` : ''}
      GROUP BY usuario_id
      ORDER BY monto_vencido DESC
      LIMIT 10
    `;

    const morosoParams = periodo ? [...params, periodo] : params;
    const morosoResult = await query(morosoQuery, morosoParams);

    // Estadísticas de pago por mes (últimos 6 meses)
    const pagosPorMesQuery = `
      SELECT 
        DATE_TRUNC('month', fecha_pago) as mes,
        COUNT(*) as pagos_realizados,
        SUM(monto) as monto_recaudado
      FROM cuotas 
      WHERE estado = 'pagado' 
        AND fecha_pago >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', fecha_pago)
      ORDER BY mes DESC
    `;

    const pagosPorMesResult = await query(pagosPorMesQuery);

    const respuesta = {
      resumenGeneral: {
        totalCuotas: parseInt(resumen.total_cuotas || 0),
        montoTotal: parseFloat(resumen.monto_total || 0),
        totalPagado: parseFloat(resumen.total_pagado || 0),
        totalPendiente: parseFloat(resumen.total_pendiente || 0),
        totalVencido: parseFloat(resumen.total_vencido || 0),
        cuotasPagadas: parseInt(resumen.cuotas_pagadas || 0),
        cuotasPendientes: parseInt(resumen.cuotas_pendientes || 0),
        cuotasVencidas: parseInt(resumen.cuotas_vencidas || 0),
        montoPromedio: parseFloat(resumen.monto_promedio || 0),
        porcentajePagado: resumen.total_cuotas > 0 
          ? Math.round((parseInt(resumen.cuotas_pagadas) / parseInt(resumen.total_cuotas)) * 100) 
          : 0
      },
      resumenPorPeriodo: resumenPeriodoResult.rows.map((row: any) => ({
        periodo: row.periodo,
        totalCuotas: parseInt(row.total_cuotas),
        montoTotal: parseFloat(row.monto_total),
        totalPagado: parseFloat(row.total_pagado),
        cuotasPagadas: parseInt(row.cuotas_pagadas),
        porcentajePagado: parseFloat(row.porcentaje_pagado)
      })),
      topMorosos: morosoResult.rows.map((row: any) => ({
        usuarioId: row.usuario_id,
        cuotasVencidas: parseInt(row.cuotas_vencidas),
        montoVencido: parseFloat(row.monto_vencido)
      })),
      pagosPorMes: pagosPorMesResult.rows.map((row: any) => ({
        mes: row.mes,
        pagosRealizados: parseInt(row.pagos_realizados),
        montoRecaudado: parseFloat(row.monto_recaudado)
      })),
      filtros: {
        periodo,
        fechaInicio,
        fechaFin
      },
      fechaGeneracion: new Date().toISOString()
    };

    return createResponse(200, respuesta);

  } catch (error) {
    console.error('Error generando resumen de cuotas:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
}; 