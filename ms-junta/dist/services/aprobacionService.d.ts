import { Aprobacion, CreateAprobacion } from '../types/aprobacion';
export declare class AprobacionService {
    create(aprobacionData: CreateAprobacion): Promise<Aprobacion>;
    findAll(estado?: string): Promise<Aprobacion[]>;
    private mapDbToAprobacion;
}
