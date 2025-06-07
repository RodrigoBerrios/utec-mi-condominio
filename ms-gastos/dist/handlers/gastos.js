"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.create = void 0;
const gastoService_1 = require("../services/gastoService");
const gasto_1 = require("../types/gasto");
const response_1 = require("../utils/response");
const gastoService = new gastoService_1.GastoService();
const create = async (event) => {
    try {
        if (!event.body) {
            return (0, response_1.errorResponse)('Cuerpo de la petición es requerido', 400);
        }
        const body = JSON.parse(event.body);
        // Validar entrada usando Zod
        const validatedData = gasto_1.CreateGastoSchema.parse(body);
        const gasto = await gastoService.create(validatedData);
        return (0, response_1.successResponse)(gasto, 201);
    }
    catch (error) {
        console.error('Error creando gasto:', error);
        if (error.name === 'ZodError') {
            return (0, response_1.errorResponse)('Datos de entrada inválidos', 400, error.errors);
        }
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.create = create;
const list = async (event) => {
    try {
        const { categoria, fechaInicio, fechaFin } = event.queryStringParameters || {};
        const gastos = await gastoService.findAll(categoria, fechaInicio, fechaFin);
        return (0, response_1.successResponse)(gastos);
    }
    catch (error) {
        console.error('Error obteniendo gastos:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.list = list;
