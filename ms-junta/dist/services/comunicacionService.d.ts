import { Comunicacion, CreateComunicacion } from '../types/comunicacion';
export declare class ComunicacionService {
    create(comunicacionData: CreateComunicacion): Promise<Comunicacion>;
    findAll(tipo?: string, estado?: string): Promise<Comunicacion[]>;
    findById(comunicacionId: string): Promise<Comunicacion | null>;
    enviar(comunicacionId: string): Promise<Comunicacion | null>;
    private mapDbToComunicacion;
}
