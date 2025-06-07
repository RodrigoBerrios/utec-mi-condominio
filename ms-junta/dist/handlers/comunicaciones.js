"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviar = exports.list = exports.create = void 0;
const comunicacionService_1 = require("../services/comunicacionService");
const comunicacion_1 = require("../types/comunicacion");
const response_1 = require("../utils/response");
const comunicacionService = new comunicacionService_1.ComunicacionService();
const create = async (event) => {
    try {
        if (!event.body) {
            return (0, response_1.errorResponse)('Cuerpo de la petición es requerido', 400);
        }
        const body = JSON.parse(event.body);
        // Validar entrada usando Zod
        const validatedData = comunicacion_1.CreateComunicacionSchema.parse(body);
        const comunicacion = await comunicacionService.create(validatedData);
        return (0, response_1.successResponse)(comunicacion, 201);
    }
    catch (error) {
        console.error('Error creando comunicación:', error);
        if (error.name === 'ZodError') {
            return (0, response_1.errorResponse)('Datos de entrada inválidos', 400, error.errors);
        }
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.create = create;
const list = async (event) => {
    try {
        const { tipo, estado } = event.queryStringParameters || {};
        const comunicaciones = await comunicacionService.findAll(tipo, estado);
        return (0, response_1.successResponse)(comunicaciones);
    }
    catch (error) {
        console.error('Error obteniendo comunicaciones:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.list = list;
const enviar = async (event) => {
    try {
        const { comunicacionId } = event.pathParameters || {};
        if (!comunicacionId) {
            return (0, response_1.errorResponse)('ID de comunicación es requerido', 400);
        }
        const comunicacion = await comunicacionService.enviar(comunicacionId);
        if (!comunicacion) {
            return (0, response_1.errorResponse)('Comunicación no encontrada', 404);
        }
        return (0, response_1.successResponse)(comunicacion);
    }
    catch (error) {
        console.error('Error enviando comunicación:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.enviar = enviar;
