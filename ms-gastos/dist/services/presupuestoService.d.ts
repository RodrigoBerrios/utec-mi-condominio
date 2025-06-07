import { Presupuesto, CreatePresupuesto } from '../types/presupuesto';
export declare class PresupuestoService {
    getResumenByPeriodo(periodo: string): Promise<Presupuesto[]>;
    getResumenGeneral(): Promise<Presupuesto[]>;
    create(presupuestoData: CreatePresupuesto): Promise<Presupuesto>;
    private mapDbToPresupuesto;
}
