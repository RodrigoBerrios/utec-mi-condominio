import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { GastoService } from '../services/gastoService';
import { successResponse, errorResponse } from '../utils/response';

const s3 = new S3();
const gastoService = new GastoService();

export const upload = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    const { gastoId, fileName, fileContent, contentType } = body;

    if (!gastoId || !fileName || !fileContent) {
      return errorResponse('gastoId, fileName y fileContent son requeridos', 400);
    }

    // Verificar que el gasto existe
    const gasto = await gastoService.findById(gastoId);
    if (!gasto) {
      return errorResponse('Gasto no encontrado', 404);
    }

    // Generar nombre único para el archivo
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `comprobantes/${gastoId}/${uuidv4()}.${fileExtension}`;

    // Subir archivo a S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET!,
      Key: uniqueFileName,
      Body: Buffer.from(fileContent, 'base64'),
      ContentType: contentType || 'application/octet-stream',
      ACL: 'private'
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Actualizar gasto con URL del comprobante
    const gastoActualizado = await gastoService.updateComprobante(gastoId, uploadResult.Location);

    return successResponse({
      gasto: gastoActualizado,
      comprobante: {
        url: uploadResult.Location,
        key: uploadResult.Key
      }
    });
  } catch (error: any) {
    console.error('Error subiendo comprobante:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { gastoId } = event.queryStringParameters || {};

    if (!gastoId) {
      return errorResponse('gastoId es requerido', 400);
    }

    const gasto = await gastoService.findById(gastoId);
    if (!gasto) {
      return errorResponse('Gasto no encontrado', 404);
    }

    if (!gasto.urlComprobante) {
      return successResponse({
        gastoId,
        comprobantes: []
      });
    }

    // Generar URL presignada para acceso temporal al comprobante
    const s3Key = gasto.urlComprobante.split('/').slice(-3).join('/'); // Extraer key de la URL
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET!,
      Key: s3Key,
      Expires: 3600 // 1 hora
    });

    return successResponse({
      gastoId,
      comprobantes: [{
        url: signedUrl,
        originalUrl: gasto.urlComprobante
      }]
    });
  } catch (error: any) {
    console.error('Error obteniendo comprobantes:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 