import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

export const successResponse = (data: any, message: string = 'Operación exitosa') =>
  createResponse(200, { message, data });

export const createdResponse = (data: any, message: string = 'Recurso creado exitosamente') =>
  createResponse(201, { message, data });

export const errorResponse = (error: string, statusCode: number = 500, details?: any) =>
  createResponse(statusCode, { 
    error, 
    ...(details && { details })
  });

export const validationErrorResponse = (details: any) =>
  createResponse(400, {
    error: 'Datos de entrada inválidos',
    details,
  }); 