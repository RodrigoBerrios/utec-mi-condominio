import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NotificacionService } from '../services/notificacionService';
import { CreateNotificacionSchema, NotificacionAutomaticaSchema } from '../types/notificacion';
import { ZodError } from 'zod';
import { 
  createResponse, 
  successResponse, 
  createdResponse, 
  errorResponse, 
  validationErrorResponse 
} from '../utils/responses';

const notificacionService = new NotificacionService();

/**
 * POST /notificaciones
 * Enviar notificación manual
 */
export const crearNotificacion = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('El cuerpo de la petición es requerido', 400);
    }

    const data = JSON.parse(event.body);
    
    // Validar datos de entrada
    const validatedData = CreateNotificacionSchema.parse(data);

    // Crear la notificación
    const notificacion = await notificacionService.create(validatedData);

    return createdResponse(notificacion, 'Notificación creada exitosamente');

  } catch (error) {
    console.error('Error creando notificación:', error);

    if (error instanceof ZodError) {
      return validationErrorResponse(error.errors);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
};

/**
 * POST /notificaciones/automaticas
 * Programar envío automático de alertas
 */
export const configurarNotificacionAutomatica = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('El cuerpo de la petición es requerido', 400);
    }

    const data = JSON.parse(event.body);
    
    // Validar datos de entrada
    const validatedData = NotificacionAutomaticaSchema.parse(data);

    // Configurar la notificación automática
    await notificacionService.configurarNotificacionAutomatica(validatedData);

    return successResponse(
      validatedData, 
      'Configuración de notificación automática guardada exitosamente'
    );

  } catch (error) {
    console.error('Error configurando notificación automática:', error);

    if (error instanceof ZodError) {
      return validationErrorResponse(error.errors);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
};

/**
 * GET /notificaciones/historial
 * Ver historial de notificaciones enviadas
 */
export const obtenerHistorial = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const usuarioId = queryParams.usuarioId;
    const limite = queryParams.limite ? parseInt(queryParams.limite, 10) : 50;

    // Validar límite
    if (limite < 1 || limite > 100) {
      return errorResponse('El límite debe estar entre 1 y 100', 400);
    }

    // Obtener historial
    const notificaciones = await notificacionService.obtenerHistorial(usuarioId, limite);

    return createResponse(200, {
      message: 'Historial obtenido exitosamente',
      data: notificaciones,
      meta: {
        total: notificaciones.length,
        limite,
        usuarioId: usuarioId || 'todos',
      },
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);

    return errorResponse(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
};

/**
 * GET /notificaciones/configuraciones
 * Obtener configuraciones automáticas (endpoint adicional útil)
 */
export const obtenerConfiguraciones = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const configuraciones = await notificacionService.obtenerConfiguracionesAutomaticas();

    return successResponse(configuraciones, 'Configuraciones obtenidas exitosamente');

  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);

    return errorResponse(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
}; 