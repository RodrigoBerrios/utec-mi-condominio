"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.upload = void 0;
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
const gastoService_1 = require("../services/gastoService");
const response_1 = require("../utils/response");
const s3 = new aws_sdk_1.S3();
const gastoService = new gastoService_1.GastoService();
const upload = async (event) => {
    try {
        if (!event.body) {
            return (0, response_1.errorResponse)('Cuerpo de la petición es requerido', 400);
        }
        const body = JSON.parse(event.body);
        const { gastoId, fileName, fileContent, contentType } = body;
        if (!gastoId || !fileName || !fileContent) {
            return (0, response_1.errorResponse)('gastoId, fileName y fileContent son requeridos', 400);
        }
        // Verificar que el gasto existe
        const gasto = await gastoService.findById(gastoId);
        if (!gasto) {
            return (0, response_1.errorResponse)('Gasto no encontrado', 404);
        }
        // Generar nombre único para el archivo
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `comprobantes/${gastoId}/${(0, uuid_1.v4)()}.${fileExtension}`;
        // Subir archivo a S3
        const uploadParams = {
            Bucket: process.env.S3_BUCKET,
            Key: uniqueFileName,
            Body: Buffer.from(fileContent, 'base64'),
            ContentType: contentType || 'application/octet-stream',
            ACL: 'private'
        };
        const uploadResult = await s3.upload(uploadParams).promise();
        // Actualizar gasto con URL del comprobante
        const gastoActualizado = await gastoService.updateComprobante(gastoId, uploadResult.Location);
        return (0, response_1.successResponse)({
            gasto: gastoActualizado,
            comprobante: {
                url: uploadResult.Location,
                key: uploadResult.Key
            }
        });
    }
    catch (error) {
        console.error('Error subiendo comprobante:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.upload = upload;
const get = async (event) => {
    try {
        const { gastoId } = event.queryStringParameters || {};
        if (!gastoId) {
            return (0, response_1.errorResponse)('gastoId es requerido', 400);
        }
        const gasto = await gastoService.findById(gastoId);
        if (!gasto) {
            return (0, response_1.errorResponse)('Gasto no encontrado', 404);
        }
        if (!gasto.urlComprobante) {
            return (0, response_1.successResponse)({
                gastoId,
                comprobantes: []
            });
        }
        // Generar URL presignada para acceso temporal al comprobante
        const s3Key = gasto.urlComprobante.split('/').slice(-3).join('/'); // Extraer key de la URL
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            Expires: 3600 // 1 hora
        });
        return (0, response_1.successResponse)({
            gastoId,
            comprobantes: [{
                    url: signedUrl,
                    originalUrl: gasto.urlComprobante
                }]
        });
    }
    catch (error) {
        console.error('Error obteniendo comprobantes:', error);
        return (0, response_1.errorResponse)('Error interno del servidor', 500);
    }
};
exports.get = get;
