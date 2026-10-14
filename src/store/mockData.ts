import type {
  AuditoriaLog,
  Cita,
  Cliente,
  Pago,
  ParametrosSistema,
  Porton,
  Servicio,
  Tecnico,
  TipoServicioCatalogo,
  User,
} from '../types';

export const INITIAL_USERS: User[] = [];
export const INITIAL_CATALOG: TipoServicioCatalogo[] = [];
export const INITIAL_TECHNICIANS: Tecnico[] = [];
export const INITIAL_CLIENTS: Cliente[] = [];
export const INITIAL_GATES: Porton[] = [];
export const INITIAL_SERVICES: Servicio[] = [];
export const INITIAL_APPOINTMENTS: Cita[] = [];
export const INITIAL_PAYMENTS: Pago[] = [];
export const INITIAL_AUDIT_LOGS: AuditoriaLog[] = [];

export const INITIAL_SYSTEM_PARAMS: ParametrosSistema = {
  sessionTimeoutMinutes: 30,
  maxFailedLoginAttempts: 3,
  lockoutTimeMinutes: 15,
};
