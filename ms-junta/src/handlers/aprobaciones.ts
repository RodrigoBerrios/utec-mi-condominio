import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AprobacionService } from '../services/aprobacionService';
import { CreateAprobacionSchema } from '../types/aprobacion';
import { successResponse, errorResponse } from '../utils/response';

const aprobacionService = new AprobacionService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateAprobacionSchema.parse(body);
    
    const aprobacion = await aprobacionService.create(validatedData);
    
    return successResponse(aprobacion, 201);
  } catch (error: any) {
    console.error('Error creando aprobación extraordinaria:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { estado } = event.queryStringParameters || {};
    
    const aprobaciones = await aprobacionService.findAll(estado);
    
    return successResponse(aprobaciones);
  } catch (error: any) {
    console.error('Error obteniendo aprobaciones:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 