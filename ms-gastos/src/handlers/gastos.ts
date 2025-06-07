import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GastoService } from '../services/gastoService';
import { CreateGastoSchema } from '../types/gasto';
import { successResponse, errorResponse } from '../utils/response';

const gastoService = new GastoService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateGastoSchema.parse(body);
    
    const gasto = await gastoService.create(validatedData);
    
    return successResponse(gasto, 201);
  } catch (error: any) {
    console.error('Error creando gasto:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { categoria, fechaInicio, fechaFin } = event.queryStringParameters || {};
    
    const gastos = await gastoService.findAll(categoria, fechaInicio, fechaFin);
    
    return successResponse(gastos);
  } catch (error: any) {
    console.error('Error obteniendo gastos:', error);
    return errorResponse('Error interno del servidor', 500);
  }
}; 