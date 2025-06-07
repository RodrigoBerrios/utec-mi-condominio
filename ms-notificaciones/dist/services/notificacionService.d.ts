import { CreateNotificacion, Notificacion, NotificacionAutomatica } from '../types/notificacion';
export declare class NotificacionService {
    private sesClient;
    constructor();
    create(data: CreateNotificacion): Promise<Notificacion>;
    obtenerHistorial(usuarioId?: string, limite?: number): Promise<Notificacion[]>;
    configurarNotificacionAutomatica(config: NotificacionAutomatica): Promise<void>;
    obtenerConfiguracionesAutomaticas(): Promise<NotificacionAutomatica[]>;
    private enviarEmail;
    private actualizarEstado;
}
//# sourceMappingURL=notificacionService.d.ts.map