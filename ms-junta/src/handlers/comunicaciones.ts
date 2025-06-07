import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ComunicacionService } from '../services/comunicacionService';
import { CreateComunicacionSchema } from '../types/comunicacion';
import { successResponse, errorResponse } from '../utils/response';

const comunicacionService = new ComunicacionService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateComunicacionSchema.parse(body);
    
    const comunicacion = await comunicacionService.create(validatedData);
    
    return successResponse(comunicacion, 201);
  } catch (error: any) {
    console.error('Error creando comunicación:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { tipo, estado } = event.queryStringParameters || {};
    
    const comunicaciones = await comunicacionService.findAll(tipo, estado);
    
    return successResponse(comunicaciones);
  } catch (error: any) {
    console.error('Error obteniendo comunicaciones:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const enviar = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { comunicacionId } = event.pathParameters || {};
    
    if (!comunicacionId) {
      return errorResponse('ID de comunicación es requerido', 400);
    }
    
    const comunicacion = await comunicacionService.enviar(comunicacionId);
    
    if (!comunicacion) {
      return errorResponse('Comunicación no encontrada', 404);
    }
    
    return successResponse(comunicacion);
  } catch (error: any) {
    console.error('Error enviando comunicación:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 