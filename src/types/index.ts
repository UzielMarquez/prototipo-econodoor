// Entidades y Tipos del Sistema Web Econodoor conforme a SRS v1.0

export type UserRole = 'admin' | 'staff' | 'technician';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  technicianId?: string; // Vinculado si role === 'technician' (A2.2)
  failedAttempts: number;
  lockedUntil?: string;
}

export type TipoCliente = 'persona' | 'empresa';

export interface DireccionServicio {
  id: string;
  clienteId: string;
  calleNumero: string;
  colonia: string;
  ciudad: string;
  referencias?: string;
}

export interface Cliente {
  id: string;
  tipo: TipoCliente;
  nombreOrazonSocial: string; // Nombre completo (persona) o Razón Social (empresa)
  nombreContacto?: string;     // Obligatorio para empresa (P1.1)
  telefono: string;
  activo: boolean;
  direcciones: DireccionServicio[];
  fechaRegistro: string;
}

export type InputDireccion = Omit<DireccionServicio, 'id' | 'clienteId'>;
export type InputCliente = Omit<Cliente, 'id' | 'fechaRegistro' | 'direcciones'> & {
  direcciones: InputDireccion[];
};

export type TipoPorton = 'corredizo' | 'abatible' | 'levadizo' | 'seccional';

export interface Porton {
  id: string;
  clienteId: string;
  direccionId: string;
  tipo: TipoPorton;
  marcaMotor: string;
  modeloMotor: string;
  fechaInstalacion?: string;
  notas?: string;
}

export type TipoServicioId = 'instalacion' | 'preventivo' | 'correctivo';

export interface TipoServicioCatalogo {
  id: TipoServicioId;
  nombre: string;
  descripcion: string;
  duracionMinutos: number; // Duración estimada predeterminada (A3.1)
  precioBase: number;       // Precio base sugerido (A3.2)
}

export type EstadoServicio = 'solicitado' | 'programado' | 'en_proceso' | 'terminado' | 'cancelado';
export type EstadoPago = 'pendiente' | 'parcial' | 'pagado';

export interface ElementoChecklist {
  id: string;
  nombre: string;
  estado: '' | 'correcto' | 'requiere_ajuste' | 'danado' | 'no_aplica';
  observacion?: string;
}

export interface Servicio {
  id: string;
  codigoFolio: string;
  clienteId: string;
  portonId: string;
  tipoServicioId: TipoServicioId;
  estado: EstadoServicio;
  estadoPago: EstadoPago;
  costo: number; // Costo pactado/final (P3.5)
  descripcionFalla?: string; // Para correctivos (P3.2)
  trabajoRealizado?: string; // Captura del técnico al concluir (T2.2, T2.4)
  checklistPreventivo?: ElementoChecklist[]; // Para preventivos (T2.3)
  observacionesTecnico?: string;
  fechaSolicitud: string;
  fechaRealAtencion?: string; // Conservada por separado (T2.5)
  motivoCancelacion?: string; // Para cancelados (P3.6)
  usuarioCancelo?: string;
  citaId?: string;
}

export type EstadoCita = 'programada' | 'atendida' | 'cancelada';

export interface Cita {
  id: string;
  servicioId: string;
  tecnicoId: string;
  fechaAcordada: string; // YYYY-MM-DD
  fechaOriginalmenteAcordada: string; // YYYY-MM-DD (P4.4)
  horaInicio: string; // HH:mm (formato 24h)
  duracionMinutos: number;
  estado: EstadoCita;
  motivoReprogramacion?: string;
}

export interface HorarioDia {
  activo: boolean;
  horaInicio: string; // "08:00"
  horaFin: string;    // "17:00"
}

export interface DisponibilidadSemanal {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
  domingo: HorarioDia;
}

export interface Tecnico {
  id: string;
  nombreCompleto: string;
  telefono: string;
  activo: boolean; // (A1.1)
  especialidad: string;
  disponibilidad: DisponibilidadSemanal; // (A1.2)
}

export interface Pago {
  id: string;
  servicioId: string;
  fecha: string; // YYYY-MM-DD
  importe: number;
  anulado: boolean;
  motivoAnulacion?: string;
  usuarioRegistro: string;
  fechaRegistro: string;
}

export interface AuditoriaLog {
  id: string;
  usuario: string;
  accion: string;
  entidadAfectada: string;
  entidadId: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivo?: string;
  fechaHora: string; // ISO timestamp
}

export interface ParametrosSistema {
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  lockoutTimeMinutes: number;
}
