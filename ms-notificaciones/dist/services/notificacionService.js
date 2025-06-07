"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionService = void 0;
const uuid_1 = require("uuid");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_ses_1 = require("@aws-sdk/client-ses");
const dynamodb_1 = require("../config/dynamodb");
class NotificacionService {
    constructor() {
        this.sesClient = new client_ses_1.SESClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    async create(data) {
        const notificacion = {
            notificacionId: (0, uuid_1.v4)(),
            ...data,
            estado: 'pendiente',
            fechaCreacion: new Date().toISOString(),
        };
        const command = new lib_dynamodb_1.PutCommand({
            TableName: dynamodb_1.TABLE_NAME,
            Item: notificacion,
        });
        try {
            await dynamodb_1.dynamoDb.send(command);
            // Intentar enviar la notificación inmediatamente
            if (data.tipo === 'email') {
                await this.enviarEmail(notificacion);
            }
            return notificacion;
        }
        catch (error) {
            console.error('Error creando notificación:', error);
            throw new Error('No se pudo crear la notificación');
        }
    }
    async obtenerHistorial(usuarioId, limite = 50) {
        try {
            let command;
            if (usuarioId) {
                command = new lib_dynamodb_1.QueryCommand({
                    TableName: dynamodb_1.TABLE_NAME,
                    IndexName: 'UsuarioIndex',
                    KeyConditionExpression: 'destinatario = :destinatario',
                    ExpressionAttributeValues: {
                        ':destinatario': usuarioId,
                    },
                    Limit: limite,
                    ScanIndexForward: false, // Ordenar por fecha más reciente
                });
            }
            else {
                command = new lib_dynamodb_1.ScanCommand({
                    TableName: dynamodb_1.TABLE_NAME,
                    Limit: limite,
                });
            }
            const response = await dynamodb_1.dynamoDb.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error('Error obteniendo historial:', error);
            throw new Error('No se pudo obtener el historial de notificaciones');
        }
    }
    async configurarNotificacionAutomatica(config) {
        const configId = `config_${config.tipo}`;
        const command = new lib_dynamodb_1.PutCommand({
            TableName: dynamodb_1.TABLE_NAME,
            Item: {
                notificacionId: configId,
                tipo: 'configuracion',
                configuracionAutomatica: config,
                fechaCreacion: new Date().toISOString(),
            },
        });
        try {
            await dynamodb_1.dynamoDb.send(command);
        }
        catch (error) {
            console.error('Error configurando notificación automática:', error);
            throw new Error('No se pudo configurar la notificación automática');
        }
    }
    async obtenerConfiguracionesAutomaticas() {
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: dynamodb_1.TABLE_NAME,
            FilterExpression: 'tipo = :tipo',
            ExpressionAttributeValues: {
                ':tipo': 'configuracion',
            },
        });
        try {
            const response = await dynamodb_1.dynamoDb.send(command);
            return response.Items?.map(item => item.configuracionAutomatica) || [];
        }
        catch (error) {
            console.error('Error obteniendo configuraciones automáticas:', error);
            throw new Error('No se pudieron obtener las configuraciones automáticas');
        }
    }
    async enviarEmail(notificacion) {
        const params = {
            Source: process.env.FROM_EMAIL || 'noreply@micondominio.com',
            Destination: {
                ToAddresses: [notificacion.destinatario],
            },
            Message: {
                Subject: {
                    Data: notificacion.asunto,
                    Charset: 'UTF-8',
                },
                Body: {
                    Text: {
                        Data: notificacion.mensaje,
                        Charset: 'UTF-8',
                    },
                    Html: {
                        Data: `
              <html>
                <body>
                  <h2>${notificacion.asunto}</h2>
                  <p>${notificacion.mensaje.replace(/\n/g, '<br>')}</p>
                  <hr>
                  <small>Este es un mensaje automático del sistema MiCondominio</small>
                </body>
              </html>
            `,
                        Charset: 'UTF-8',
                    },
                },
            },
        };
        try {
            const command = new client_ses_1.SendEmailCommand(params);
            await this.sesClient.send(command);
            // Actualizar estado a enviado
            await this.actualizarEstado(notificacion.notificacionId, 'enviado');
        }
        catch (error) {
            console.error('Error enviando email:', error);
            await this.actualizarEstado(notificacion.notificacionId, 'fallido');
            throw error;
        }
    }
    async actualizarEstado(notificacionId, estado) {
        const command = new lib_dynamodb_1.UpdateCommand({
            TableName: dynamodb_1.TABLE_NAME,
            Key: { notificacionId },
            UpdateExpression: 'SET estado = :estado, fechaEnvio = :fechaEnvio',
            ExpressionAttributeValues: {
                ':estado': estado,
                ':fechaEnvio': new Date().toISOString(),
            },
        });
        try {
            await dynamodb_1.dynamoDb.send(command);
        }
        catch (error) {
            console.error('Error actualizando estado:', error);
        }
    }
}
exports.NotificacionService = NotificacionService;
//# sourceMappingURL=notificacionService.js.map