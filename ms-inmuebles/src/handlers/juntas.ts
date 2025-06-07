import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { JuntaService } from '../services/juntaService';
import { CreateJuntaSchema } from '../types/junta';
import { successResponse, errorResponse } from '../utils/response';

const juntaService = new JuntaService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateJuntaSchema.parse(body);
    
    const junta = await juntaService.create(validatedData);
    
    return successResponse(junta, 201);
  } catch (error: any) {
    console.error('Error creando junta:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { inmuebleId } = event.queryStringParameters || {};
    
    let juntas;
    if (inmuebleId) {
      juntas = await juntaService.findByInmueble(inmuebleId);
    } else {
      juntas = await juntaService.findAll();
    }
    
    return successResponse(juntas);
  } catch (error: any) {
    console.error('Error obteniendo juntas:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 