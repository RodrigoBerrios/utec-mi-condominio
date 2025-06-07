import { APIGatewayProxyResult } from 'aws-lambda';
export declare const successResponse: (data: any, statusCode?: number) => APIGatewayProxyResult;
export declare const errorResponse: (message: string, statusCode?: number, details?: any) => APIGatewayProxyResult;
