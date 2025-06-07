import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InmuebleService } from '../services/inmuebleService';
import { CreateInmuebleSchema } from '../types/inmueble';
import { successResponse, errorResponse } from '../utils/response';

const inmuebleService = new InmuebleService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateInmuebleSchema.parse(body);
    
    const inmueble = await inmuebleService.create(validatedData);
    
    return successResponse(inmueble, 201);
  } catch (error: any) {
    console.error('Error creando inmueble:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmuebles = await inmuebleService.findAll();
    
    return successResponse(inmuebles);
  } catch (error: any) {
    console.error('Error obteniendo inmuebles:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 