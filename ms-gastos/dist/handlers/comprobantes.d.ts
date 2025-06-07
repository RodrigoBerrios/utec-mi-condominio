import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const upload: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const get: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
