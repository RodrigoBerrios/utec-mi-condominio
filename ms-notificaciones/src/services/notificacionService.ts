import { v4 as uuidv4 } from 'uuid';
import { PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { dynamoDb, TABLE_NAME } from '../config/dynamodb';
import { CreateNotificacion, Notificacion, NotificacionAutomatica } from '../types/notificacion';

export class NotificacionService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async create(data: CreateNotificacion): Promise<Notificacion> {
    const notificacion: Notificacion = {
      notificacionId: uuidv4(),
      ...data,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: notificacion,
    });

    try {
      await dynamoDb.send(command);
      
      // Intentar enviar la notificación inmediatamente
      if (data.tipo === 'email') {
        await this.enviarEmail(notificacion);
      }
      
      return notificacion;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw new Error('No se pudo crear la notificación');
    }
  }

  async obtenerHistorial(usuarioId?: string, limite: number = 50): Promise<Notificacion[]> {
    try {
      let command;
      
      if (usuarioId) {
        command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'UsuarioIndex',
          KeyConditionExpression: 'destinatario = :destinatario',
          ExpressionAttributeValues: {
            ':destinatario': usuarioId,
          },
          Limit: limite,
          ScanIndexForward: false, // Ordenar por fecha más reciente
        });
      } else {
        command = new ScanCommand({
          TableName: TABLE_NAME,
          Limit: limite,
        });
      }

      const response = await dynamoDb.send(command);
      return (response.Items as Notificacion[]) || [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw new Error('No se pudo obtener el historial de notificaciones');
    }
  }

  async configurarNotificacionAutomatica(config: NotificacionAutomatica): Promise<void> {
    const configId = `config_${config.tipo}`;
    
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        notificacionId: configId,
        tipo: 'configuracion',
        configuracionAutomatica: config,
        fechaCreacion: new Date().toISOString(),
      },
    });

    try {
      await dynamoDb.send(command);
    } catch (error) {
      console.error('Error configurando notificación automática:', error);
      throw new Error('No se pudo configurar la notificación automática');
    }
  }

  async obtenerConfiguracionesAutomaticas(): Promise<NotificacionAutomatica[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'tipo = :tipo',
      ExpressionAttributeValues: {
        ':tipo': 'configuracion',
      },
    });

    try {
      const response = await dynamoDb.send(command);
      return response.Items?.map(item => item.configuracionAutomatica) || [];
    } catch (error) {
      console.error('Error obteniendo configuraciones automáticas:', error);
      throw new Error('No se pudieron obtener las configuraciones automáticas');
    }
  }

  private async enviarEmail(notificacion: Notificacion): Promise<void> {
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
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      
      // Actualizar estado a enviado
      await this.actualizarEstado(notificacion.notificacionId, 'enviado');
    } catch (error) {
      console.error('Error enviando email:', error);
      await this.actualizarEstado(notificacion.notificacionId, 'fallido');
      throw error;
    }
  }

  private async actualizarEstado(notificacionId: string, estado: 'enviado' | 'fallido'): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { notificacionId },
      UpdateExpression: 'SET estado = :estado, fechaEnvio = :fechaEnvio',
      ExpressionAttributeValues: {
        ':estado': estado,
        ':fechaEnvio': new Date().toISOString(),
      },
    });

    try {
      await dynamoDb.send(command);
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  }
} 