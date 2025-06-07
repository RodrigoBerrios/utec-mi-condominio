import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query } from '../config/database';
import { CreateCuotaSchema, CuotaSchema, Cuota } from '../types/cuota';
import { EventService } from '../services/eventService';
import { v4 as uuidv4 } from 'uuid';

const eventService = new EventService();

// Función helper para response
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
  },
  body: JSON.stringify(body)
});

// CREATE - Crear nueva cuota
export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validar datos de entrada
    const validationResult = CreateCuotaSchema.safeParse(body);
    if (!validationResult.success) {
      return createResponse(400, {
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }

    const cuotaData = validationResult.data;
    const cuotaId = uuidv4();

    const insertQuery = `
      INSERT INTO cuotas (
        cuota_id, usuario_id, inmueble_id, periodo, monto, 
        fecha_vencimiento, estado, fecha_creacion
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', NOW())
      RETURNING *
    `;

    const values = [
      cuotaId,
      cuotaData.usuarioId,
      cuotaData.inmuebleId,
      cuotaData.periodo,
      cuotaData.monto,
      cuotaData.fechaVencimiento
    ];

    const result = await query(insertQuery, values);
    const nuevaCuota = result.rows[0];

    // Publicar evento de cuota creada
    await eventService.publishCuotaCreada({
      cuotaId: nuevaCuota.cuota_id,
      usuarioId: nuevaCuota.usuario_id,
      inmuebleId: nuevaCuota.inmueble_id,
      monto: parseFloat(nuevaCuota.monto),
      periodo: nuevaCuota.periodo,
      fechaVencimiento: nuevaCuota.fecha_vencimiento.toISOString()
    });

    return createResponse(201, {
      message: 'Cuota creada exitosamente',
      cuota: nuevaCuota
    });

  } catch (error) {
    console.error('Error creando cuota:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// READ - Listar todas las cuotas
export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { queryStringParameters } = event;
    const limit = parseInt(queryStringParameters?.limit || '50');
    const offset = parseInt(queryStringParameters?.offset || '0');
    const estado = queryStringParameters?.estado;
    const periodo = queryStringParameters?.periodo;

    let whereClause = '';
    let params: any[] = [];
    let paramIndex = 1;

    if (estado) {
      whereClause += ` WHERE estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (periodo) {
      whereClause += estado ? ` AND periodo = $${paramIndex}` : ` WHERE periodo = $${paramIndex}`;
      params.push(periodo);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM cuotas${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const selectQuery = `
      SELECT * FROM cuotas 
      ${whereClause}
      ORDER BY fecha_creacion DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const result = await query(selectQuery, params);

    return createResponse(200, {
      cuotas: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error listando cuotas:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// READ - Obtener cuota por ID
export const getById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};

    if (!id) {
      return createResponse(400, {
        error: 'ID de cuota requerido'
      });
    }

    const selectQuery = `SELECT * FROM cuotas WHERE cuota_id = $1`;
    const result = await query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return createResponse(404, {
        error: 'Cuota no encontrada'
      });
    }

    return createResponse(200, {
      cuota: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo cuota:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// UPDATE - Actualizar cuota
export const update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || '{}');

    if (!id) {
      return createResponse(400, {
        error: 'ID de cuota requerido'
      });
    }

    // Verificar que la cuota existe
    const existsQuery = `SELECT * FROM cuotas WHERE cuota_id = $1`;
    const existsResult = await query(existsQuery, [id]);

    if (existsResult.rows.length === 0) {
      return createResponse(404, {
        error: 'Cuota no encontrada'
      });
    }

    // Construir query de actualización dinámicamente
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.monto !== undefined) {
      updateFields.push(`monto = $${paramIndex}`);
      values.push(body.monto);
      paramIndex++;
    }

    if (body.fechaVencimiento !== undefined) {
      updateFields.push(`fecha_vencimiento = $${paramIndex}`);
      values.push(body.fechaVencimiento);
      paramIndex++;
    }

    if (body.estado !== undefined) {
      updateFields.push(`estado = $${paramIndex}`);
      values.push(body.estado);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return createResponse(400, {
        error: 'No hay campos para actualizar'
      });
    }

    updateFields.push(`fecha_actualizacion = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE cuotas 
      SET ${updateFields.join(', ')}
      WHERE cuota_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    const cuotaActualizada = result.rows[0];

    // Publicar evento de cuota actualizada
    await eventService.publishCuotaActualizada({
      cuotaId: cuotaActualizada.cuota_id,
      usuarioId: cuotaActualizada.usuario_id,
      cambios: body
    });

    return createResponse(200, {
      message: 'Cuota actualizada exitosamente',
      cuota: cuotaActualizada
    });

  } catch (error) {
    console.error('Error actualizando cuota:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// DELETE - Eliminar cuota
export const deleteHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};

    if (!id) {
      return createResponse(400, {
        error: 'ID de cuota requerido'
      });
    }

    // Verificar que la cuota existe y obtener datos antes de eliminar
    const selectQuery = `SELECT * FROM cuotas WHERE cuota_id = $1`;
    const selectResult = await query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      return createResponse(404, {
        error: 'Cuota no encontrada'
      });
    }

    const cuota = selectResult.rows[0];

    // No permitir eliminar cuotas pagadas
    if (cuota.estado === 'pagado') {
      return createResponse(400, {
        error: 'No se puede eliminar una cuota pagada'
      });
    }

    const deleteQuery = `DELETE FROM cuotas WHERE cuota_id = $1`;
    await query(deleteQuery, [id]);

    // Publicar evento de cuota eliminada
    await eventService.publishCuotaEliminada({
      cuotaId: id,
      usuarioId: cuota.usuario_id,
      inmuebleId: cuota.inmueble_id
    });

    return createResponse(200, {
      message: 'Cuota eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuota:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Marcar cuota como pagada
export const markPagada = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || '{}');

    if (!id) {
      return createResponse(400, {
        error: 'ID de cuota requerido'
      });
    }

    // Verificar que la cuota existe y está pendiente
    const selectQuery = `SELECT * FROM cuotas WHERE cuota_id = $1`;
    const selectResult = await query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      return createResponse(404, {
        error: 'Cuota no encontrada'
      });
    }

    const cuota = selectResult.rows[0];

    if (cuota.estado === 'pagado') {
      return createResponse(400, {
        error: 'La cuota ya está marcada como pagada'
      });
    }

    const updateQuery = `
      UPDATE cuotas 
      SET estado = 'pagado', fecha_pago = NOW()
      WHERE cuota_id = $1
      RETURNING *
    `;

    const result = await query(updateQuery, [id]);
    const cuotaPagada = result.rows[0];

    // Publicar evento de pago realizado
    await eventService.publishPagoRealizado({
      cuotaId: id,
      usuarioId: cuota.usuario_id,
      inmuebleId: cuota.inmueble_id,
      monto: parseFloat(cuota.monto),
      fechaPago: cuotaPagada.fecha_pago.toISOString(),
      metodoPago: body.metodoPago || 'no_especificado'
    });

    return createResponse(200, {
      message: 'Cuota marcada como pagada exitosamente',
      cuota: cuotaPagada
    });

  } catch (error) {
    console.error('Error marcando cuota como pagada:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Obtener cuotas por usuario
export const getByUsuario = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { idUsuario } = event.pathParameters || {};
    const { queryStringParameters } = event;

    if (!idUsuario) {
      return createResponse(400, {
        error: 'ID de usuario requerido'
      });
    }

    const limit = parseInt(queryStringParameters?.limit || '50');
    const offset = parseInt(queryStringParameters?.offset || '0');
    const estado = queryStringParameters?.estado;

    let whereClause = 'WHERE usuario_id = $1';
    let params: any[] = [idUsuario];
    let paramIndex = 2;

    if (estado) {
      whereClause += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    const selectQuery = `
      SELECT * FROM cuotas 
      ${whereClause}
      ORDER BY fecha_vencimiento DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await query(selectQuery, params);

    return createResponse(200, {
      cuotas: result.rows,
      usuarioId: idUsuario
    });

  } catch (error) {
    console.error('Error obteniendo cuotas por usuario:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Obtener cuotas por período
export const getByPeriodo = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { periodo } = event.pathParameters || {};

    if (!periodo) {
      return createResponse(400, {
        error: 'Período requerido (formato YYYY-MM)'
      });
    }

    // Validar formato de período
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return createResponse(400, {
        error: 'Formato de período inválido. Use YYYY-MM'
      });
    }

    const selectQuery = `
      SELECT 
        c.*,
        COUNT(*) OVER() as total_cuotas,
        SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) OVER() as total_pagado,
        SUM(CASE WHEN estado != 'pagado' THEN monto ELSE 0 END) OVER() as total_pendiente
      FROM cuotas c
      WHERE periodo = $1
      ORDER BY fecha_vencimiento ASC
    `;

    const result = await query(selectQuery, [periodo]);

    return createResponse(200, {
      periodo,
      cuotas: result.rows,
      resumen: result.rows.length > 0 ? {
        totalCuotas: parseInt(result.rows[0].total_cuotas),
        totalPagado: parseFloat(result.rows[0].total_pagado),
        totalPendiente: parseFloat(result.rows[0].total_pendiente)
      } : {
        totalCuotas: 0,
        totalPagado: 0,
        totalPendiente: 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo cuotas por período:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Obtener estado de cuenta
export const getEstadoCuenta = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { idUsuario } = event.pathParameters || {};

    if (!idUsuario) {
      return createResponse(400, {
        error: 'ID de usuario requerido'
      });
    }

    // Obtener resumen del estado de cuenta
    const resumenQuery = `
      SELECT 
        usuario_id,
        COUNT(*) as total_cuotas,
        SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as total_pagado,
        SUM(CASE WHEN estado != 'pagado' THEN monto ELSE 0 END) as total_pendiente,
        COUNT(CASE WHEN estado = 'vencido' THEN 1 END) as cuotas_vencidas,
        MAX(CASE WHEN estado = 'pagado' THEN fecha_pago END) as ultimo_pago
      FROM cuotas 
      WHERE usuario_id = $1
      GROUP BY usuario_id
    `;

    const resumenResult = await query(resumenQuery, [idUsuario]);

    if (resumenResult.rows.length === 0) {
      return createResponse(404, {
        error: 'No se encontraron cuotas para este usuario'
      });
    }

    const resumen = resumenResult.rows[0];

    // Obtener todas las cuotas del usuario
    const cuotasQuery = `
      SELECT * FROM cuotas 
      WHERE usuario_id = $1 
      ORDER BY fecha_vencimiento DESC
    `;

    const cuotasResult = await query(cuotasQuery, [idUsuario]);

    const estadoCuenta = {
      usuarioId: idUsuario,
      totalPendiente: parseFloat(resumen.total_pendiente || 0),
      totalPagado: parseFloat(resumen.total_pagado || 0),
      cuotasVencidas: parseInt(resumen.cuotas_vencidas || 0),
      ultimoPago: resumen.ultimo_pago,
      cuotas: cuotasResult.rows
    };

    return createResponse(200, estadoCuenta);

  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Obtener lista de morosos
export const getMorosos = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const morosoQuery = `
      SELECT 
        usuario_id,
        COUNT(*) as cuotas_vencidas,
        SUM(monto) as monto_total_vencido,
        MIN(fecha_vencimiento) as primera_cuota_vencida,
        MAX(fecha_vencimiento) as ultima_cuota_vencida,
        EXTRACT(DAY FROM NOW() - MIN(fecha_vencimiento)) as dias_moroso
      FROM cuotas 
      WHERE estado = 'vencido'
      GROUP BY usuario_id
      HAVING COUNT(*) > 0
      ORDER BY monto_total_vencido DESC
    `;

    const result = await query(morosoQuery);

    return createResponse(200, {
      morosos: result.rows.map(row => ({
        usuarioId: row.usuario_id,
        cuotasVencidas: parseInt(row.cuotas_vencidas),
        montoTotalVencido: parseFloat(row.monto_total_vencido),
        primeraCuotaVencida: row.primera_cuota_vencida,
        ultimaCuotaVencida: row.ultima_cuota_vencida,
        diasMoroso: parseInt(row.dias_moroso)
      })),
      totalMorosos: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo morosos:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Obtener cuotas vencidas
export const getVencidas = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const vencidasQuery = `
      SELECT 
        *,
        EXTRACT(DAY FROM NOW() - fecha_vencimiento) as dias_vencido
      FROM cuotas 
      WHERE fecha_vencimiento < NOW() 
        AND estado IN ('pendiente', 'vencido')
      ORDER BY fecha_vencimiento ASC
    `;

    const result = await query(vencidasQuery);

    return createResponse(200, {
      cuotasVencidas: result.rows.map(row => ({
        ...row,
        diasVencido: parseInt(row.dias_vencido)
      })),
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo cuotas vencidas:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Generar cuotas masivas
export const generateMasivas = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { periodo, inmuebles, monto, fechaVencimiento } = body;

    if (!periodo || !inmuebles || !monto || !fechaVencimiento) {
      return createResponse(400, {
        error: 'Período, inmuebles, monto y fecha de vencimiento son requeridos'
      });
    }

    // Validar formato de período
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return createResponse(400, {
        error: 'Formato de período inválido. Use YYYY-MM'
      });
    }

    const cuotasCreadas = [];
    
    for (const inmueble of inmuebles) {
      if (!inmueble.usuarioId || !inmueble.inmuebleId) {
        continue;
      }

      const cuotaId = uuidv4();
      
      const insertQuery = `
        INSERT INTO cuotas (
          cuota_id, usuario_id, inmueble_id, periodo, monto, 
          fecha_vencimiento, estado, fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', NOW())
        RETURNING *
      `;

      const values = [
        cuotaId,
        inmueble.usuarioId,
        inmueble.inmuebleId,
        periodo,
        monto,
        fechaVencimiento
      ];

      try {
        const result = await query(insertQuery, values);
        cuotasCreadas.push(result.rows[0]);

        // Publicar evento de cuota creada
        await eventService.publishCuotaCreada({
          cuotaId: result.rows[0].cuota_id,
          usuarioId: result.rows[0].usuario_id,
          inmuebleId: result.rows[0].inmueble_id,
          monto: parseFloat(result.rows[0].monto),
          periodo: result.rows[0].periodo,
          fechaVencimiento: result.rows[0].fecha_vencimiento.toISOString()
        });
      } catch (error) {
        console.error(`Error creando cuota para inmueble ${inmueble.inmuebleId}:`, error);
      }
    }

    return createResponse(201, {
      message: `${cuotasCreadas.length} cuotas generadas exitosamente`,
      cuotasCreadas: cuotasCreadas.length,
      periodo,
      cuotas: cuotasCreadas
    });

  } catch (error) {
    console.error('Error generando cuotas masivas:', error);
    return createResponse(500, {
      error: 'Error interno del servidor'
    });
  }
};

// Exportar delete como deleteHandler para evitar conflicto con palabra reservada
export { deleteHandler as delete }; 