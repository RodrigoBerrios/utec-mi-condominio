export interface APIResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
  };
  body: string;
}

export const createResponse = (statusCode: number, body: any): APIResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
  },
  body: JSON.stringify(body)
});

export const createSuccessResponse = (data: any, message?: string): APIResponse => {
  return createResponse(200, {
    success: true,
    message: message || 'Operación exitosa',
    data
  });
};

export const createCreatedResponse = (data: any, message?: string): APIResponse => {
  return createResponse(201, {
    success: true,
    message: message || 'Recurso creado exitosamente',
    data
  });
};

export const createErrorResponse = (statusCode: number, error: string, details?: any): APIResponse => {
  return createResponse(statusCode, {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  });
};

export const createValidationErrorResponse = (errors: any[]): APIResponse => {
  return createErrorResponse(400, 'Datos inválidos', errors);
};

export const createNotFoundResponse = (resource?: string): APIResponse => {
  return createErrorResponse(404, `${resource || 'Recurso'} no encontrado`);
};

export const createInternalErrorResponse = (error?: string): APIResponse => {
  return createErrorResponse(500, error || 'Error interno del servidor');
}; 