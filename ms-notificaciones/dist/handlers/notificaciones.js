"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerConfiguraciones = exports.obtenerHistorial = exports.configurarNotificacionAutomatica = exports.crearNotificacion = void 0;
const notificacionService_1 = require("../services/notificacionService");
const notificacion_1 = require("../types/notificacion");
const zod_1 = require("zod");
const responses_1 = require("../utils/responses");
const notificacionService = new notificacionService_1.NotificacionService();
/**
 * POST /notificaciones
 * Enviar notificación manual
 */
const crearNotificacion = async (event) => {
    try {
        if (!event.body) {
            return (0, responses_1.errorResponse)('El cuerpo de la petición es requerido', 400);
        }
        const data = JSON.parse(event.body);
        // Validar datos de entrada
        const validatedData = notificacion_1.CreateNotificacionSchema.parse(data);
        // Crear la notificación
        const notificacion = await notificacionService.create(validatedData);
        return (0, responses_1.createdResponse)(notificacion, 'Notificación creada exitosamente');
    }
    catch (error) {
        console.error('Error creando notificación:', error);
        if (error instanceof zod_1.ZodError) {
            return (0, responses_1.validationErrorResponse)(error.errors);
        }
        return (0, responses_1.errorResponse)(error instanceof Error ? error.message : 'Error desconocido', 500);
    }
};
exports.crearNotificacion = crearNotificacion;
/**
 * POST /notificaciones/automaticas
 * Programar envío automático de alertas
 */
const configurarNotificacionAutomatica = async (event) => {
    try {
        if (!event.body) {
            return (0, responses_1.errorResponse)('El cuerpo de la petición es requerido', 400);
        }
        const data = JSON.parse(event.body);
        // Validar datos de entrada
        const validatedData = notificacion_1.NotificacionAutomaticaSchema.parse(data);
        // Configurar la notificación automática
        await notificacionService.configurarNotificacionAutomatica(validatedData);
        return (0, responses_1.successResponse)(validatedData, 'Configuración de notificación automática guardada exitosamente');
    }
    catch (error) {
        console.error('Error configurando notificación automática:', error);
        if (error instanceof zod_1.ZodError) {
            return (0, responses_1.validationErrorResponse)(error.errors);
        }
        return (0, responses_1.errorResponse)(error instanceof Error ? error.message : 'Error desconocido', 500);
    }
};
exports.configurarNotificacionAutomatica = configurarNotificacionAutomatica;
/**
 * GET /notificaciones/historial
 * Ver historial de notificaciones enviadas
 */
const obtenerHistorial = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const usuarioId = queryParams.usuarioId;
        const limite = queryParams.limite ? parseInt(queryParams.limite, 10) : 50;
        // Validar límite
        if (limite < 1 || limite > 100) {
            return (0, responses_1.errorResponse)('El límite debe estar entre 1 y 100', 400);
        }
        // Obtener historial
        const notificaciones = await notificacionService.obtenerHistorial(usuarioId, limite);
        return (0, responses_1.createResponse)(200, {
            message: 'Historial obtenido exitosamente',
            data: notificaciones,
            meta: {
                total: notificaciones.length,
                limite,
                usuarioId: usuarioId || 'todos',
            },
        });
    }
    catch (error) {
        console.error('Error obteniendo historial:', error);
        return (0, responses_1.errorResponse)(error instanceof Error ? error.message : 'Error desconocido', 500);
    }
};
exports.obtenerHistorial = obtenerHistorial;
/**
 * GET /notificaciones/configuraciones
 * Obtener configuraciones automáticas (endpoint adicional útil)
 */
const obtenerConfiguraciones = async (event) => {
    try {
        const configuraciones = await notificacionService.obtenerConfiguracionesAutomaticas();
        return (0, responses_1.successResponse)(configuraciones, 'Configuraciones obtenidas exitosamente');
    }
    catch (error) {
        console.error('Error obteniendo configuraciones:', error);
        return (0, responses_1.errorResponse)(error instanceof Error ? error.message : 'Error desconocido', 500);
    }
};
exports.obtenerConfiguraciones = obtenerConfiguraciones;
//# sourceMappingURL=notificaciones.js.map