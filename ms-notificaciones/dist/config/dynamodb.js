"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_NAME = exports.dynamoDb = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
exports.dynamoDb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
exports.TABLE_NAME = process.env.DYNAMODB_TABLE || 'notificaciones-dev';
//# sourceMappingURL=dynamodb.js.map