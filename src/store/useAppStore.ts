import { create } from 'zustand';
import { 
  Cliente, 
  DireccionServicio,
  InputCliente,
  Porton, 
  TipoServicioCatalogo, 
  Servicio, 
  Cita, 
  Tecnico, 
  Pago, 
  AuditoriaLog, 
  User, 
  UserRole,
  ParametrosSistema,
  EstadoServicio,
  EstadoPago,
  ElementoChecklist
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CATALOG, 
  INITIAL_TECHNICIANS, 
  INITIAL_CLIENTS, 
  INITIAL_GATES, 
  INITIAL_SERVICES, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PAYMENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SYSTEM_PARAMS,
} from './mockData';

const createDemoUser = (role: UserRole): User => ({
  id: 'demo-session',
  username: '',
  name: role === 'admin' ? 'Administrador' : role === 'staff' ? 'Recepcionista' : 'Técnico',
  email: '',
  role,
  active: true,
  failedAttempts: 0,
});

interface AppState {
  // Simulación de sesión y rol activo
  currentUser: User;
  isAuthenticated: boolean;
  users: User[];
  enterDemo: (role: UserRole) => void;
  signOut: () => void;
  systemParams: ParametrosSistema;
  updateSystemParams: (params: Partial<ParametrosSistema>) => void;

  // Catálogo
  catalog: TipoServicioCatalogo[];
  addCatalogItem: (item: TipoServicioCatalogo) => boolean;
  updateCatalogItem: (id: string, precioBase: number, duracionMinutos: number) => void;

  // Clientes y Direcciones
  clients: Cliente[];
  checkPhoneExists: (phone: string, excludeClientId?: string) => boolean;
  addClient: (client: InputCliente) => Cliente;
  updateClient: (id: string, data: Partial<Cliente>) => void;
  deactivateClient: (id: string) => { success: boolean; message: string };
  reactivateClient: (id: string) => void;
  addAddressToClient: (clienteId: string, address: { calleNumero: string; colonia: string; ciudad: string; referencias?: string }) => void;

  // Portones
  gates: Porton[];
  addGate: (gate: Omit<Porton, 'id'>) => Porton;
  updateGate: (id: string, data: Partial<Porton>) => void;

  // Técnicos
  technicians: Tecnico[];
  addTechnician: (tech: Omit<Tecnico, 'id'>) => Tecnico;
  updateTechnician: (id: string, data: Partial<Tecnico>) => void;
  toggleTechnicianStatus: (id: string, motivo?: string) => { affectedAppointments: Cita[] };

  // Servicios
  services: Servicio[];
  addService: (service: {
    clienteId: string;
    portonId: string;
    tipoServicioId: 'instalacion' | 'preventivo' | 'correctivo';
    costo: number;
    descripcionFalla?: string;
  }) => Servicio;
  cancelService: (serviceId: string, motivo: string) => void;
  updateServiceStatusByTech: (serviceId: string, nuevoEstado: EstadoServicio) => void;
  completeServiceByTech: (serviceId: string, data: {
    trabajoRealizado: string;
    checklist?: ElementoChecklist[];
    observaciones?: string;
    fechaRealAtencion: string;
  }) => { success: boolean; error?: string };
  adminCorrectService: (serviceId: string, data: Partial<Servicio>, motivo: string) => void;

  // Citas y Algoritmo de Disponibilidad
  appointments: Cita[];
  checkTechnicianAvailability: (
    tecnicoId: string, 
    fecha: string, 
    horaInicio: string, 
    duracionMinutos: number, 
    excludeCitaId?: string
  ) => { available: boolean; reason?: string };
  bookAppointment: (data: {
    servicioId: string;
    tecnicoId: string;
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
  }) => { success: boolean; error?: string; appointment?: Cita };
  rescheduleAppointment: (citaId: string, nuevaFecha: string, nuevaHora: string, motivo: string) => { success: boolean; error?: string };
  reassignAppointment: (citaId: string, nuevoTecnicoId: string, motivo: string) => { success: boolean; error?: string };

  // Pagos
  payments: Pago[];
  registerPayment: (servicioId: string, importe: number, fecha: string) => { success: boolean; error?: string };
  voidPayment: (pagoId: string, motivo: string) => { success: boolean; error?: string };

  // Logs de Auditoría
  auditLogs: AuditoriaLog[];
  addAuditLog: (entry: Omit<AuditoriaLog, 'id' | 'fechaHora'>) => void;

  // Helpers computados
  getServicePaymentState: (servicioId: string) => {
    costoTotal: number;
    totalPagado: number;
    saldoPendiente: number;
    estado: EstadoPago;
  };
}

// Helper para calcular día de la semana en español
const getDayKey = (dateStr: string): keyof Tecnico['disponibilidad'] => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 domingo, 1 lunes...
  const map: Record<number, keyof Tecnico['disponibilidad']> = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado'
  };
  return map[day];
};

// Convierte "09:30" a minutos desde medianoche
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: createDemoUser('staff'),
  isAuthenticated: false,
  users: INITIAL_USERS,
  systemParams: INITIAL_SYSTEM_PARAMS,
  catalog: INITIAL_CATALOG,
  technicians: INITIAL_TECHNICIANS,
  clients: INITIAL_CLIENTS,
  gates: INITIAL_GATES,
  services: INITIAL_SERVICES,
  appointments: INITIAL_APPOINTMENTS,
  payments: INITIAL_PAYMENTS,
  auditLogs: INITIAL_AUDIT_LOGS,

  enterDemo: role => {
    const technician = role === 'technician'
      ? get().technicians.find(item => item.activo)
      : undefined;
    set({
      currentUser: {
        ...createDemoUser(role),
        ...(technician ? { technicianId: technician.id } : {}),
      },
      isAuthenticated: true,
    });
  },

  signOut: () => set({ isAuthenticated: false }),

  updateSystemParams: (params) => {
    set(state => ({
      systemParams: { ...state.systemParams, ...params }
    }));
  },

  updateCatalogItem: (id, precioBase, duracionMinutos) => {
    set(state => ({
      catalog: state.catalog.map(item => 
        item.id === id ? { ...item, precioBase, duracionMinutos } : item
      )
    }));
  },
  addCatalogItem: item => {
    if (get().catalog.some(current => current.id === item.id)) return false;
    set(state => ({ catalog: [...state.catalog, item] }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Configuración de tipo de servicio',
      entidadAfectada: 'Tipo de servicio',
      entidadId: item.id,
      valorNuevo: `${item.nombre}: $${item.precioBase} MXN, ${item.duracionMinutos} min`,
    });
    return true;
  },

  checkPhoneExists: (phone, excludeClientId) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return get().clients.some(c => 
      c.id !== excludeClientId && c.telefono.replace(/\D/g, '') === cleanPhone
    );
  },

  addClient: (clientData) => {
    const newId = `cli-${Date.now()}`;
    const newClient: Cliente = {
      ...clientData,
      id: newId,
      activo: true,
      fechaRegistro: getLocalDate(),
      direcciones: clientData.direcciones.map((d, idx) => ({
        ...d,
        id: `dir-${newId}-${idx + 1}`,
        clienteId: newId,
      })),
    };

    set(state => ({
      clients: [newClient, ...state.clients]
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Registro de Cliente',
      entidadAfectada: 'Cliente',
      entidadId: newId,
      valorNuevo: `${newClient.nombreOrazonSocial} (${newClient.tipo})`,
    });

    return newClient;
  },

  updateClient: (id, data) => {
    const prev = get().clients.find(c => c.id === id);
    set(state => ({
      clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c)
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Actualización de Cliente',
      entidadAfectada: 'Cliente',
      entidadId: id,
      valorAnterior: prev?.nombreOrazonSocial,
      valorNuevo: data.nombreOrazonSocial || prev?.nombreOrazonSocial,
    });
  },

  deactivateClient: (id) => {
    // P1.6: Ningún cliente podrá ser eliminado físicamente si tiene servicios registrados; solo podrá desactivarse.
    set(state => ({
      clients: state.clients.map(c => c.id === id ? { ...c, activo: false } : c)
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Desactivación de Cliente',
      entidadAfectada: 'Cliente',
      entidadId: id,
    });
    return { success: true, message: 'Cliente desactivado correctamente.' };
  },

  reactivateClient: (id) => {
    // P1.7: Reactivación
    set(state => ({
      clients: state.clients.map(c => c.id === id ? { ...c, activo: true } : c)
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Reactivación de Cliente',
      entidadAfectada: 'Cliente',
      entidadId: id,
    });
  },

  addAddressToClient: (clienteId, address) => {
    const newAddress: DireccionServicio = {
      id: `dir-${Date.now()}`,
      clienteId,
      ...address,
    };
    set(state => ({
      clients: state.clients.map(c => 
        c.id === clienteId 
          ? { ...c, direcciones: [...c.direcciones, newAddress] } 
          : c
      )
    }));
  },

  addGate: (gateData) => {
    const newGate: Porton = {
      ...gateData,
      id: `por-${Date.now()}`,
    };
    set(state => ({
      gates: [newGate, ...state.gates]
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Registro de Portón',
      entidadAfectada: 'Porton',
      entidadId: newGate.id,
      valorNuevo: `${newGate.marcaMotor} ${newGate.modeloMotor} (${newGate.tipo})`,
    });
    return newGate;
  },

  updateGate: (id, data) => {
    set(state => ({
      gates: state.gates.map(g => g.id === id ? { ...g, ...data } : g)
    }));
  },

  addTechnician: (techData) => {
    const newTech: Tecnico = {
      ...techData,
      id: `tec-${Date.now()}`,
    };
    set(state => ({
      technicians: [...state.technicians, newTech]
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Alta de Técnico',
      entidadAfectada: 'Tecnico',
      entidadId: newTech.id,
      valorNuevo: newTech.nombreCompleto,
    });
    return newTech;
  },

  updateTechnician: (id, data) => {
    set(state => ({
      technicians: state.technicians.map(t => t.id === id ? { ...t, ...data } : t)
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Actualización de Técnico/Horario',
      entidadAfectada: 'Tecnico',
      entidadId: id,
    });
  },

  toggleTechnicianStatus: (id, motivo) => {
    const tech = get().technicians.find(t => t.id === id);
    if (!tech) return { affectedAppointments: [] };
    const willBeActive = !tech.activo;

    // Si se desactiva, buscar citas futuras asignadas (A1.4)
    const today = getLocalDate();
    const affected = willBeActive ? [] : get().appointments.filter(a => 
      a.tecnicoId === id && a.fechaAcordada >= today && a.estado === 'programada'
    );

    set(state => ({
      technicians: state.technicians.map(t => t.id === id ? { ...t, activo: willBeActive } : t)
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: willBeActive ? 'Reactivación de Técnico' : 'Desactivación de Técnico',
      entidadAfectada: 'Tecnico',
      entidadId: id,
      valorAnterior: tech.activo ? 'Activo' : 'Inactivo',
      valorNuevo: willBeActive ? 'Activo' : 'Inactivo',
      motivo: motivo || 'Cambio de estatus operativo',
    });

    return { affectedAppointments: affected };
  },

  addService: (data) => {
    const folioNumber = get().services.length + 1;
    const codigoFolio = `SRV-${new Date().getFullYear()}-${String(folioNumber).padStart(3, '0')}`;
    const newService: Servicio = {
      id: `srv-${Date.now()}`,
      codigoFolio,
      clienteId: data.clienteId,
      portonId: data.portonId,
      tipoServicioId: data.tipoServicioId,
      estado: 'solicitado', // P3.3
      estadoPago: 'pendiente', // P3.4
      costo: data.costo, // P3.5
      descripcionFalla: data.descripcionFalla,
      fechaSolicitud: getLocalDate(),
    };

    set(state => ({
      services: [newService, ...state.services]
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Solicitud de Servicio',
      entidadAfectada: 'Servicio',
      entidadId: newService.id,
      valorNuevo: `${newService.codigoFolio} - Costo: $${newService.costo}`,
    });

    return newService;
  },

  cancelService: (serviceId, motivo) => {
    // P3.6: Un servicio cancelado conservará su registro, deberá indicar el motivo de cancelación y no podrá eliminarse.
    // Sus citas futuras quedarán canceladas y la acción se registrará en la bitácora de citas.
    const service = get().services.find(s => s.id === serviceId);
    if (!service) return;

    set(state => ({
      services: state.services.map(s => s.id === serviceId ? {
        ...s,
        estado: 'cancelado',
        motivoCancelacion: motivo,
        usuarioCancelo: get().currentUser.name,
      } : s),
      appointments: state.appointments.map(a => a.servicioId === serviceId && a.estado === 'programada' ? {
        ...a,
        estado: 'cancelada',
      } : a),
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Cancelación de Servicio',
      entidadAfectada: 'Servicio',
      entidadId: serviceId,
      motivo,
    });
  },

  updateServiceStatusByTech: (serviceId, nuevoEstado) => {
    set(state => ({
      services: state.services.map(s => s.id === serviceId ? { ...s, estado: nuevoEstado } : s)
    }));
  },

  completeServiceByTech: (serviceId, data) => {
    // T2.4: El técnico podrá marcar el servicio como terminado solo después de haber capturado la descripción del trabajo realizado.
    // El sistema rechazará el cierre si este campo está vacío.
    if (!data.trabajoRealizado || data.trabajoRealizado.trim().length === 0) {
      return { success: false, error: 'Describe el trabajo realizado.' };
    }
    if (data.checklist?.some(item => !item.estado)) {
      return { success: false, error: 'Completa la lista de revisión.' };
    }

    set(state => ({
      services: state.services.map(s => s.id === serviceId ? {
        ...s,
        estado: 'terminado',
        trabajoRealizado: data.trabajoRealizado,
        checklistPreventivo: data.checklist,
        observacionesTecnico: data.observaciones,
        fechaRealAtencion: data.fechaRealAtencion || getLocalDate(), // T2.5
      } : s),
      appointments: state.appointments.map(a => a.servicioId === serviceId ? {
        ...a,
        estado: 'atendida'
      } : a),
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Cierre de Trabajo Realizado',
      entidadAfectada: 'Servicio',
      entidadId: serviceId,
      valorNuevo: 'Terminado',
    });

    return { success: true };
  },

  adminCorrectService: (serviceId, data, motivo) => {
    // A4.1, A4.2: El administrador podrá corregir un servicio ya cerrado, indicando el motivo en el log.
    const prev = get().services.find(s => s.id === serviceId);
    set(state => ({
      services: state.services.map(s => s.id === serviceId ? { ...s, ...data } : s)
    }));
    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Corrección de Servicio Cerrado (Admin)',
      entidadAfectada: 'Servicio',
      entidadId: serviceId,
      valorAnterior: JSON.stringify(prev),
      valorNuevo: JSON.stringify(data),
      motivo,
    });
  },

  checkTechnicianAvailability: (tecnicoId, fecha, horaInicio, duracionMinutos, excludeCitaId) => {
    // P4.2 y P4.3: El selector mostrará únicamente los técnicos activos cuyo horario laboral semanal incluya el horario
    // de la cita y que no tengan otra cita que se cruce en ese horario.
    const tech = get().technicians.find(t => t.id === tecnicoId);
    if (!tech || !tech.activo) {
      return { available: false, reason: 'Técnico inactivo.' };
    }

    const dayKey = getDayKey(fecha);
    const daySchedule = tech.disponibilidad[dayKey];
    if (!daySchedule || !daySchedule.activo) {
      return { available: false, reason: 'No disponible ese día.' };
    }

    const proposedStart = timeToMinutes(horaInicio);
    const proposedEnd = proposedStart + duracionMinutos;

    const workStart = timeToMinutes(daySchedule.horaInicio);
    const workEnd = timeToMinutes(daySchedule.horaFin);

    if (proposedStart < workStart || proposedEnd > workEnd) {
      return { 
        available: false, 
        reason: 'Fuera del horario laboral.' 
      };
    }

    // Verificar traslapes de citas para ese técnico en esa fecha
    const existingCitas = get().appointments.filter(a => 
      a.tecnicoId === tecnicoId && 
      a.fechaAcordada === fecha && 
      a.estado === 'programada' &&
      a.id !== excludeCitaId
    );

    for (const cita of existingCitas) {
      const citaStart = timeToMinutes(cita.horaInicio);
      const citaEnd = citaStart + cita.duracionMinutos;

      // Verificación de choque de intervalos: max(start1, start2) < min(end1, end2)
      if (Math.max(proposedStart, citaStart) < Math.min(proposedEnd, citaEnd)) {
        return { 
          available: false, 
          reason: 'Horario ocupado.'
        };
      }
    }

    return { available: true };
  },

  bookAppointment: (data) => {
    const check = get().checkTechnicianAvailability(
      data.tecnicoId, 
      data.fecha, 
      data.horaInicio, 
      data.duracionMinutos
    );

    if (!check.available) {
      return { success: false, error: check.reason };
    }

    const newAppointment: Cita = {
      id: `cit-${Date.now()}`,
      servicioId: data.servicioId,
      tecnicoId: data.tecnicoId,
      fechaAcordada: data.fecha,
      fechaOriginalmenteAcordada: data.fecha,
      horaInicio: data.horaInicio,
      duracionMinutos: data.duracionMinutos,
      estado: 'programada',
    };

    set(state => ({
      appointments: [...state.appointments, newAppointment],
      // P3.3: Al agendar su cita, el servicio pasará a "programado"
      services: state.services.map(s => s.id === data.servicioId ? {
        ...s,
        estado: 'programado',
        citaId: newAppointment.id
      } : s)
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Agendar Cita',
      entidadAfectada: 'Cita',
      entidadId: newAppointment.id,
      valorNuevo: `Fecha: ${data.fecha} ${data.horaInicio} (Técnico: ${data.tecnicoId})`,
    });

    return { success: true, appointment: newAppointment };
  },

  rescheduleAppointment: (citaId, nuevaFecha, nuevaHora, motivo) => {
    // P4.4: La reprogramación conservará registrada la fecha originalmente acordada y la nueva fecha, y aplicará validación P4.3
    const cita = get().appointments.find(a => a.id === citaId);
    if (!cita) return { success: false, error: 'Cita no encontrada.' };

    const check = get().checkTechnicianAvailability(
      cita.tecnicoId, 
      nuevaFecha, 
      nuevaHora, 
      cita.duracionMinutos, 
      citaId
    );

    if (!check.available) {
      return { success: false, error: check.reason };
    }

    set(state => ({
      appointments: state.appointments.map(a => a.id === citaId ? {
        ...a,
        fechaAcordada: nuevaFecha,
        horaInicio: nuevaHora,
        motivoReprogramacion: motivo,
      } : a)
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Reprogramación de Cita (P4.7)',
      entidadAfectada: 'Cita',
      entidadId: citaId,
      valorAnterior: `${cita.fechaAcordada} ${cita.horaInicio}`,
      valorNuevo: `${nuevaFecha} ${nuevaHora}`,
      motivo,
    });

    return { success: true };
  },

  reassignAppointment: (citaId, nuevoTecnicoId, motivo) => {
    // P4.5: El personal podrá reasignar la cita a otro técnico, aplicando validación de disponibilidad
    const cita = get().appointments.find(a => a.id === citaId);
    if (!cita) return { success: false, error: 'Cita no encontrada.' };

    const check = get().checkTechnicianAvailability(
      nuevoTecnicoId, 
      cita.fechaAcordada, 
      cita.horaInicio, 
      cita.duracionMinutos, 
      citaId
    );

    if (!check.available) {
      return { success: false, error: check.reason };
    }

    set(state => ({
      appointments: state.appointments.map(a => a.id === citaId ? {
        ...a,
        tecnicoId: nuevoTecnicoId,
      } : a)
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Reasignación de Técnico en Cita (P4.7)',
      entidadAfectada: 'Cita',
      entidadId: citaId,
      valorAnterior: `Técnico: ${cita.tecnicoId}`,
      valorNuevo: `Técnico: ${nuevoTecnicoId}`,
      motivo,
    });

    return { success: true };
  },

  registerPayment: (servicioId, importe, fecha) => {
    // P6.1: Servicio, fecha e importe no vacíos.
    // P6.3: Rechazará pago cero, negativo o que haga que supere el costo.
    if (!fecha || !importe || importe <= 0) {
      return { success: false, error: 'Importe o fecha inválidos.' };
    }

    const { saldoPendiente, costoTotal } = get().getServicePaymentState(servicioId);
    if (importe > saldoPendiente) {
      return { 
        success: false, 
        error: `Excede el saldo de $${saldoPendiente.toLocaleString()}.` 
      };
    }

    const newPayment: Pago = {
      id: `pag-${Date.now()}`,
      servicioId,
      fecha,
      importe,
      anulado: false,
      usuarioRegistro: get().currentUser.name,
      fechaRegistro: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const newPayments = [...get().payments, newPayment];
    // Recalcular estado de pago (P6.7)
    const validPayments = newPayments.filter(p => p.servicioId === servicioId && !p.anulado);
    const sum = validPayments.reduce((acc, curr) => acc + curr.importe, 0);

    let nuevoEstadoPago: EstadoPago = 'pendiente';
    if (sum === costoTotal) {
      nuevoEstadoPago = 'pagado';
    } else if (sum > 0) {
      nuevoEstadoPago = 'parcial';
    }

    set(state => ({
      payments: newPayments,
      services: state.services.map(s => s.id === servicioId ? { ...s, estadoPago: nuevoEstadoPago } : s)
    }));

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Registro de Pago',
      entidadAfectada: 'Pago',
      entidadId: newPayment.id,
      valorNuevo: `Importe: $${importe.toLocaleString()} MXN (Servicio: ${servicioId})`,
    });

    return { success: true };
  },

  voidPayment: (pagoId, motivo) => {
    // P6.5: Un pago registrado no podrá eliminarse. Si hay un error, el personal podrá anularlo indicando el motivo.
    // P6.6: Toda anulación de pago quedará registrada con usuario y fecha y hora exacta.
    const pago = get().payments.find(p => p.id === pagoId);
    if (!pago) return { success: false, error: 'Pago no encontrado.' };

    const newPayments = get().payments.map(p => p.id === pagoId ? {
      ...p,
      anulado: true,
      motivoAnulacion: motivo,
    } : p);

    const service = get().services.find(s => s.id === pago.servicioId);
    if (service) {
      const validPayments = newPayments.filter(p => p.servicioId === pago.servicioId && !p.anulado);
      const sum = validPayments.reduce((acc, curr) => acc + curr.importe, 0);

      let nuevoEstadoPago: EstadoPago = 'pendiente';
      if (sum === service.costo) {
        nuevoEstadoPago = 'pagado';
      } else if (sum > 0) {
        nuevoEstadoPago = 'parcial';
      }

      set(state => ({
        payments: newPayments,
        services: state.services.map(s => s.id === pago.servicioId ? { ...s, estadoPago: nuevoEstadoPago } : s)
      }));
    } else {
      set({ payments: newPayments });
    }

    get().addAuditLog({
      usuario: get().currentUser.name,
      accion: 'Anulación de Pago (P6.6)',
      entidadAfectada: 'Pago',
      entidadId: pagoId,
      valorAnterior: `$${pago.importe} Vigente`,
      valorNuevo: 'Anulado',
      motivo,
    });

    return { success: true };
  },

  addAuditLog: (entry) => {
    const newLog: AuditoriaLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    set(state => ({
      auditLogs: [newLog, ...state.auditLogs]
    }));
  },

  getServicePaymentState: (servicioId) => {
    const service = get().services.find(s => s.id === servicioId);
    const costoTotal = service ? service.costo : 0;
    const validPayments = get().payments.filter(p => p.servicioId === servicioId && !p.anulado);
    const totalPagado = validPayments.reduce((acc, curr) => acc + curr.importe, 0);
    const saldoPendiente = Math.max(0, costoTotal - totalPagado);

    let estado: EstadoPago = 'pendiente';
    if (totalPagado >= costoTotal && costoTotal > 0) {
      estado = 'pagado';
    } else if (totalPagado > 0) {
      estado = 'parcial';
    }

    return { costoTotal, totalPagado, saldoPendiente, estado };
  },
}));
