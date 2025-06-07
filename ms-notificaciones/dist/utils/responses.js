"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationErrorResponse = exports.errorResponse = exports.createdResponse = exports.successResponse = exports.createResponse = void 0;
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
});
exports.createResponse = createResponse;
const successResponse = (data, message = 'Operación exitosa') => (0, exports.createResponse)(200, { message, data });
exports.successResponse = successResponse;
const createdResponse = (data, message = 'Recurso creado exitosamente') => (0, exports.createResponse)(201, { message, data });
exports.createdResponse = createdResponse;
const errorResponse = (error, statusCode = 500, details) => (0, exports.createResponse)(statusCode, {
    error,
    ...(details && { details })
});
exports.errorResponse = errorResponse;
const validationErrorResponse = (details) => (0, exports.createResponse)(400, {
    error: 'Datos de entrada inválidos',
    details,
});
exports.validationErrorResponse = validationErrorResponse;
//# sourceMappingURL=responses.js.map