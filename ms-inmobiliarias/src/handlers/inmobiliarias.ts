import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InmobiliariaService } from '../services/inmobiliariaService';
import { CreateInmobiliariaSchema, UpdateInmobiliariaSchema } from '../types/inmobiliaria';
import { successResponse, errorResponse } from '../utils/response';

const inmobiliariaService = new InmobiliariaService();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = CreateInmobiliariaSchema.parse(body);
    
    const inmobiliaria = await inmobiliariaService.create(validatedData);
    
    return successResponse(inmobiliaria, 201);
  } catch (error: any) {
    console.error('Error creando inmobiliaria:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return errorResponse('El RUC ya está registrado', 409);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmobiliarias = await inmobiliariaService.findAll();
    
    return successResponse(inmobiliarias);
  } catch (error: any) {
    console.error('Error obteniendo inmobiliarias:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const getById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmobiliariaId = event.pathParameters?.id;
    
    if (!inmobiliariaId) {
      return errorResponse('ID de inmobiliaria es requerido', 400);
    }
    
    const inmobiliaria = await inmobiliariaService.findById(inmobiliariaId);
    
    if (!inmobiliaria) {
      return errorResponse('Inmobiliaria no encontrada', 404);
    }
    
    return successResponse(inmobiliaria);
  } catch (error: any) {
    console.error('Error obteniendo inmobiliaria:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

export const update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmobiliariaId = event.pathParameters?.id;
    
    if (!inmobiliariaId) {
      return errorResponse('ID de inmobiliaria es requerido', 400);
    }
    
    if (!event.body) {
      return errorResponse('Cuerpo de la petición es requerido', 400);
    }

    const body = JSON.parse(event.body);
    
    // Validar entrada usando Zod
    const validatedData = UpdateInmobiliariaSchema.parse(body);
    
    const inmobiliaria = await inmobiliariaService.update(inmobiliariaId, validatedData);
    
    if (!inmobiliaria) {
      return errorResponse('Inmobiliaria no encontrada', 404);
    }
    
    return successResponse(inmobiliaria);
  } catch (error: any) {
    console.error('Error actualizando inmobiliaria:', error);
    
    if (error.name === 'ZodError') {
      return errorResponse('Datos de entrada inválidos', 400, error.errors);
    }
    
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return errorResponse('El RUC ya está registrado', 409);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const deleteInmobiliaria = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmobiliariaId = event.pathParameters?.id;
    
    if (!inmobiliariaId) {
      return errorResponse('ID de inmobiliaria es requerido', 400);
    }
    
    const deleted = await inmobiliariaService.delete(inmobiliariaId);
    
    if (!deleted) {
      return errorResponse('Inmobiliaria no encontrada', 404);
    }
    
    return successResponse({ message: 'Inmobiliaria eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando inmobiliaria:', error);
    
    if (error.message.includes('tiene inmuebles asociados')) {
      return errorResponse(error.message, 409);
    }
    
    return errorResponse('Error interno del servidor', 500);
  }
};

export const getInmuebles = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const inmobiliariaId = event.pathParameters?.id;
    
    if (!inmobiliariaId) {
      return errorResponse('ID de inmobiliaria es requerido', 400);
    }
    
    // Verificar que la inmobiliaria existe
    const inmobiliaria = await inmobiliariaService.findById(inmobiliariaId);
    if (!inmobiliaria) {
      return errorResponse('Inmobiliaria no encontrada', 404);
    }
    
    const inmuebles = await inmobiliariaService.findInmuebles(inmobiliariaId);
    
    return successResponse(inmuebles);
  } catch (error: any) {
    console.error('Error obteniendo inmuebles de inmobiliaria:', error);
    return errorResponse('Error interno del servidor', 500);
  }
};

// Alias para el handler delete (ya que delete es una palabra reservada)
export { deleteInmobiliaria as delete }; 