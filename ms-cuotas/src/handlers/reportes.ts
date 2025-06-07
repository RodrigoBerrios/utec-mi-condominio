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

// Generar reporte detallado de cuotas
export const cuotas = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { queryStringParameters } = event;
    const tipoReporte = queryStringParameters?.tipo || 'general'; // general, morosos, pagos, pendientes
    const periodo = queryStringParameters?.periodo;
    const fechaInicio = queryStringParameters?.fechaInicio;
    const fechaFin = queryStringParameters?.fechaFin;
    const formato = queryStringParameters?.formato || 'json'; // json, csv

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Construir filtros
    if (periodo) {
      whereClause = ` WHERE periodo = $${paramIndex}`;
      params.push(periodo);
      paramIndex++;
    } else if (fechaInicio && fechaFin) {
      whereClause = ` WHERE fecha_creacion BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fechaInicio, fechaFin);
      paramIndex += 2;
    }

    let reporteData: any = {};

    switch (tipoReporte) {
      case 'morosos':
        reporteData = await generarReporteMorosos(whereClause, params);
        break;
      case 'pagos':
        reporteData = await generarReportePagos(whereClause, params);
        break;
      case 'pendientes':
        reporteData = await generarReportePendientes(whereClause, params);
        break;
      case 'general':
      default:
        reporteData = await generarReporteGeneral(whereClause, params);
        break;
    }

    const respuesta = {
      tipoReporte,
      parametros: {
        periodo,
        fechaInicio,
        fechaFin,
        formato
      },
      fechaGeneracion: new Date().toISOString(),
      datos: reporteData
    };

    return createResponse(200, respuesta);

  } catch (error) {
    console.error('Error generando reporte:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Reporte general
async function generarReporteGeneral(whereClause: string, params: any[]) {
  const reporteQuery = `
    SELECT 
      c.*,
      EXTRACT(DAY FROM NOW() - fecha_vencimiento) as dias_desde_vencimiento,
      CASE 
        WHEN estado = 'pagado' THEN 'Al día'
        WHEN estado = 'pendiente' AND fecha_vencimiento > NOW() THEN 'Pendiente'
        WHEN estado = 'pendiente' AND fecha_vencimiento <= NOW() THEN 'Vencido'
        ELSE 'Vencido'
      END as estado_descripcion
    FROM cuotas c
    ${whereClause}
    ORDER BY fecha_vencimiento DESC
  `;

  const result = await query(reporteQuery, params);

  // Estadísticas resumidas
  const estadisticasQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagadas,
      COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
      COUNT(CASE WHEN estado = 'vencido' THEN 1 END) as vencidas,
      SUM(monto) as monto_total,
      SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as monto_pagado,
      AVG(monto) as monto_promedio
    FROM cuotas
    ${whereClause}
  `;

  const estadisticasResult = await query(estadisticasQuery, params);
  const estadisticas = estadisticasResult.rows[0];

  return {
    estadisticas: {
      totalCuotas: parseInt(estadisticas.total),
      cuotasPagadas: parseInt(estadisticas.pagadas || 0),
      cuotasPendientes: parseInt(estadisticas.pendientes || 0),
      cuotasVencidas: parseInt(estadisticas.vencidas || 0),
      montoTotal: parseFloat(estadisticas.monto_total || 0),
      montoPagado: parseFloat(estadisticas.monto_pagado || 0),
      montoPromedio: parseFloat(estadisticas.monto_promedio || 0),
      porcentajePagado: estadisticas.total > 0 
        ? Math.round((parseInt(estadisticas.pagadas || 0) / parseInt(estadisticas.total)) * 100) 
        : 0
    },
    cuotas: result.rows.map((row: any) => ({
      ...row,
      diasDesdeVencimiento: parseInt(row.dias_desde_vencimiento || 0),
      estadoDescripcion: row.estado_descripcion
    }))
  };
}

// Reporte de morosos
async function generarReporteMorosos(whereClause: string, params: any[]) {
  const morosoBaseClause = whereClause 
    ? `${whereClause} AND estado = 'vencido'` 
    : ' WHERE estado = \'vencido\'';

  const morosQuery = `
    SELECT 
      usuario_id,
      COUNT(*) as cuotas_vencidas,
      SUM(monto) as deuda_total,
      MIN(fecha_vencimiento) as primera_cuota_vencida,
      MAX(fecha_vencimiento) as ultima_cuota_vencida,
      EXTRACT(DAY FROM NOW() - MIN(fecha_vencimiento)) as dias_moroso_desde,
      STRING_AGG(periodo, ', ' ORDER BY periodo) as periodos_vencidos
    FROM cuotas
    ${morosoBaseClause}
    GROUP BY usuario_id
    ORDER BY deuda_total DESC
  `;

  const morosResult = await query(morosQuery, params);

  // Detalle de cuotas vencidas por usuario
  const detalleQuery = `
    SELECT 
      usuario_id,
      cuota_id,
      periodo,
      monto,
      fecha_vencimiento,
      EXTRACT(DAY FROM NOW() - fecha_vencimiento) as dias_vencido
    FROM cuotas
    ${morosoBaseClause}
    ORDER BY usuario_id, fecha_vencimiento
  `;

  const detalleResult = await query(detalleQuery, params);

  return {
    resumen: {
      totalMorosos: morosResult.rows.length,
      deudaTotal: morosResult.rows.reduce((acc: number, row: any) => acc + parseFloat(row.deuda_total), 0)
    },
    morosos: morosResult.rows.map((row: any) => ({
      usuarioId: row.usuario_id,
      cuotasVencidas: parseInt(row.cuotas_vencidas),
      deudaTotal: parseFloat(row.deuda_total),
      primeraCuotaVencida: row.primera_cuota_vencida,
      ultimaCuotaVencida: row.ultima_cuota_vencida,
      diasMorosoDesde: parseInt(row.dias_moroso_desde),
      periodosVencidos: row.periodos_vencidos.split(', ')
    })),
    detalleCuotas: detalleResult.rows.map((row: any) => ({
      usuarioId: row.usuario_id,
      cuotaId: row.cuota_id,
      periodo: row.periodo,
      monto: parseFloat(row.monto),
      fechaVencimiento: row.fecha_vencimiento,
      diasVencido: parseInt(row.dias_vencido)
    }))
  };
}

// Reporte de pagos
async function generarReportePagos(whereClause: string, params: any[]) {
  const pagoBaseClause = whereClause 
    ? `${whereClause} AND estado = 'pagado'` 
    : ' WHERE estado = \'pagado\'';

  const pagosQuery = `
    SELECT 
      usuario_id,
      COUNT(*) as cuotas_pagadas,
      SUM(monto) as total_pagado,
      MIN(fecha_pago) as primer_pago,
      MAX(fecha_pago) as ultimo_pago,
      AVG(EXTRACT(DAY FROM fecha_pago - fecha_vencimiento)) as promedio_dias_adelanto
    FROM cuotas
    ${pagoBaseClause}
    GROUP BY usuario_id
    ORDER BY total_pagado DESC
  `;

  const pagosResult = await query(pagosQuery, params);

  // Pagos por mes
  const pagosPorMesQuery = `
    SELECT 
      DATE_TRUNC('month', fecha_pago) as mes,
      COUNT(*) as cantidad_pagos,
      SUM(monto) as monto_recaudado
    FROM cuotas
    ${pagoBaseClause}
    GROUP BY DATE_TRUNC('month', fecha_pago)
    ORDER BY mes DESC
  `;

  const pagosPorMesResult = await query(pagosPorMesQuery, params);

  return {
    resumen: {
      totalUsuariosPagadores: pagosResult.rows.length,
      montoTotalRecaudado: pagosResult.rows.reduce((acc: number, row: any) => acc + parseFloat(row.total_pagado), 0)
    },
    pagadoresPorUsuario: pagosResult.rows.map((row: any) => ({
      usuarioId: row.usuario_id,
      cuotasPagadas: parseInt(row.cuotas_pagadas),
      totalPagado: parseFloat(row.total_pagado),
      primerPago: row.primer_pago,
      ultimoPago: row.ultimo_pago,
      promedioDiasAdelanto: parseFloat(row.promedio_dias_adelanto || 0)
    })),
    pagosPorMes: pagosPorMesResult.rows.map((row: any) => ({
      mes: row.mes,
      cantidadPagos: parseInt(row.cantidad_pagos),
      montoRecaudado: parseFloat(row.monto_recaudado)
    }))
  };
}

// Reporte de pendientes
async function generarReportePendientes(whereClause: string, params: any[]) {
  const pendienteBaseClause = whereClause 
    ? `${whereClause} AND estado = 'pendiente'` 
    : ' WHERE estado = \'pendiente\'';

  const pendientesQuery = `
    SELECT 
      *,
      EXTRACT(DAY FROM fecha_vencimiento - NOW()) as dias_para_vencimiento,
      CASE 
        WHEN fecha_vencimiento <= NOW() + INTERVAL '7 days' THEN 'Próximo a vencer'
        WHEN fecha_vencimiento <= NOW() + INTERVAL '15 days' THEN 'Por vencer'
        ELSE 'Normal'
      END as urgencia
    FROM cuotas
    ${pendienteBaseClause}
    ORDER BY fecha_vencimiento ASC
  `;

  const pendientesResult = await query(pendientesQuery, params);

  // Agrupación por urgencia
  const urgenciaGroups = {
    'Próximo a vencer': [],
    'Por vencer': [],
    'Normal': []
  };

  let montoTotalPendiente = 0;

  pendientesResult.rows.forEach((row: any) => {
    const cuota = {
      cuotaId: row.cuota_id,
      usuarioId: row.usuario_id,
      periodo: row.periodo,
      monto: parseFloat(row.monto),
      fechaVencimiento: row.fecha_vencimiento,
      diasParaVencimiento: parseInt(row.dias_para_vencimiento)
    };

    urgenciaGroups[row.urgencia as keyof typeof urgenciaGroups].push(cuota);
    montoTotalPendiente += parseFloat(row.monto);
  });

  return {
    resumen: {
      totalCuotasPendientes: pendientesResult.rows.length,
      montoTotalPendiente,
      proximasAVencer: urgenciaGroups['Próximo a vencer'].length,
      porVencer: urgenciaGroups['Por vencer'].length,
      normales: urgenciaGroups['Normal'].length
    },
    cuotasPorUrgencia: urgenciaGroups,
    todasLasCuotas: pendientesResult.rows.map((row: any) => ({
      cuotaId: row.cuota_id,
      usuarioId: row.usuario_id,
      periodo: row.periodo,
      monto: parseFloat(row.monto),
      fechaVencimiento: row.fecha_vencimiento,
      diasParaVencimiento: parseInt(row.dias_para_vencimiento),
      urgencia: row.urgencia
    }))
  };
} 