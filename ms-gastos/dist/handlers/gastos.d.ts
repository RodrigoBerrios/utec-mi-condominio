import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const create: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const list: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
