import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * POST /notificaciones
 * Enviar notificación manual
 */
export declare const crearNotificacion: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * POST /notificaciones/automaticas
 * Programar envío automático de alertas
 */
export declare const configurarNotificacionAutomatica: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * GET /notificaciones/historial
 * Ver historial de notificaciones enviadas
 */
export declare const obtenerHistorial: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * GET /notificaciones/configuraciones
 * Obtener configuraciones automáticas (endpoint adicional útil)
 */
export declare const obtenerConfiguraciones: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=notificaciones.d.ts.map