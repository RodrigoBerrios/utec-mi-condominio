import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PagoService } from '../services/pagoService';
import { CreatePagoSchema, UpdateEstadoPagoSchema } from '../types/pago';
import { successResponse, errorResponse } from '../utils/response';

const pagoService = new PagoService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreatePagoSchema.parse(body);
    
    const pago = await pagoService.create(validatedData);
    
    return successResponse(pago, 201);
  } catch (error: any) {
    console.error('Error creando pago:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { cuotaId, estado } = event.queryStringParameters || {};
    
    const pagos = await pagoService.findAll(cuotaId, estado);
    
    return successResponse(pagos);
  } catch (error: any) {
    console.error('Error obteniendo pagos:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { pagoId } = event.pathParameters || {};
    
    if (!pagoId) {
      return errorResponse('ID de pago es requerido', 400);
    }
    
    const pago = await pagoService.findById(pagoId);
    
    if (!pago) {
      return errorResponse('Pago no encontrado', 404);
    }
    
    return successResponse(pago);
  } catch (error: any) {
    console.error('Error obteniendo pago:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const updateEstado = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { pagoId } = event.pathParameters || {};
    
    if (!pagoId) {
      return errorResponse('ID de pago es requerido', 400);
    }

    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = UpdateEstadoPagoSchema.parse(body);
    
    const pago = await pagoService.updateEstado(pagoId, validatedData);
    
    if (!pago) {
      return errorResponse('Pago no encontrado', 404);
    }
    
    return successResponse(pago);
  } catch (error: any) {
    console.error('Error actualizando estado del pago:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
}; 