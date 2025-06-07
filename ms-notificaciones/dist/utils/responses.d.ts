import { APIGatewayProxyResult } from 'aws-lambda';
export declare const createResponse: (statusCode: number, body: any) => APIGatewayProxyResult;
export declare const successResponse: (data: any, message?: string) => APIGatewayProxyResult;
export declare const createdResponse: (data: any, message?: string) => APIGatewayProxyResult;
export declare const errorResponse: (error: string, statusCode?: number, details?: any) => APIGatewayProxyResult;
export declare const validationErrorResponse: (details: any) => APIGatewayProxyResult;
//# sourceMappingURL=responses.d.ts.map