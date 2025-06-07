import { Gasto, CreateGasto } from '../types/gasto';
export declare class GastoService {
    create(gastoData: CreateGasto): Promise<Gasto>;
    findAll(categoria?: string, fechaInicio?: string, fechaFin?: string): Promise<Gasto[]>;
    findById(gastoId: string): Promise<Gasto | null>;
    updateComprobante(gastoId: string, urlComprobante: string): Promise<Gasto | null>;
    private mapDbToGasto;
}
