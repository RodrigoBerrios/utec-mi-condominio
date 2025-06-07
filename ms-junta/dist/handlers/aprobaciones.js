"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.create = void 0;
const aprobacionService_1 = require("../services/aprobacionService");
const aprobacion_1 = require("../types/aprobacion");
const response_1 = require("../utils/response");
const aprobacionService = new aprobacionService_1.AprobacionService();
const create = async (event) => {
    try {
        if (!event.body) {
            return (0, response_1.errorResponse)('Cuerpo de la petición es requerido', 400);
        }
        const body = JSON.parse(event.body);
        // Validar entrada usando Zod
        const validatedData = aprobacion_1.CreateAprobacionSchema.parse(body);
        const aprobacion = await aprobacionService.create(validatedData);
        return (0, response_1.successResponse)(aprobacion, 201);
    }
    catch (error) {
        console.error('Error creando aprobación extraordinaria:', error);
        if (error.name === 'ZodError') {
            return (0, response_1.errorResponse)('Datos de entrada inválidos', 400, error.errors);
        }
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.create = create;
const list = async (event) => {
    try {
        const { estado } = event.queryStringParameters || {};
        const aprobaciones = await aprobacionService.findAll(estado);
        return (0, response_1.successResponse)(aprobaciones);
    }
    catch (error) {
        console.error('Error obteniendo aprobaciones:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.list = list;
