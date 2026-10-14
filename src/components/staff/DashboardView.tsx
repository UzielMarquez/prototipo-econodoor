import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  ReceiptText,
  Users,
  Wrench,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GlowCard } from '../ui/GlowCard';
import { StatsCounter } from '../ui/StatsCounter';
import { StatusBadge } from '../ui/StatusBadge';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    appointments,
    services,
    clients,
    gates,
    payments,
    getServicePaymentState,
  } = useAppStore();
  const today = getLocalDate();
  const activeServices = services.filter(service =>
    service.estado !== 'terminado' && service.estado !== 'cancelado',
  );
  const appointmentsToday = appointments.filter(appointment =>
    appointment.fechaAcordada === today && appointment.estado === 'programada',
  );
  const collected = payments
    .filter(payment => !payment.anulado)
    .reduce((total, payment) => total + payment.importe, 0);
  const outstanding = services.reduce(
    (total, service) => total + getServicePaymentState(service.id).saldoPendiente,
    0,
  );
  const upcomingAppointments = appointments
    .filter(appointment =>
      appointment.estado === 'programada' && appointment.fechaAcordada >= today,
    )
    .sort((a, b) =>
      `${a.fechaAcordada}${a.horaInicio}`.localeCompare(`${b.fechaAcordada}${b.horaInicio}`),
    )
    .slice(0, 4);

  const roleLabel = currentUser.role === 'admin' ? 'Administrador' : 'Recepcionista';
  const nextStep = clients.length === 0
    ? { tab: 'clients', label: 'Registrar cliente' }
    : gates.length === 0
      ? { tab: 'gates', label: 'Registrar portón' }
      : services.length === 0
        ? { tab: 'services', label: 'Crear solicitud' }
        : { tab: 'services', label: 'Nueva solicitud' };
  const operationTitle = clients.length === 0
    ? 'Registra tu primer cliente'
    : gates.length === 0
      ? 'Registra el primer portón'
      : services.length === 0
        ? 'Crea una solicitud de servicio'
        : activeServices.length
          ? 'Servicios en curso'
          : 'Sin servicios activos';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-[#E3EBF0] via-[#F2F5F7] to-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Resumen de actividad
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl">
              Operación en un vistazo.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Panel de {roleLabel.toLowerCase()} · {new Date(`${today}T12:00:00`).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={() => onNavigate(nextStep.tab)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" />
            {nextStep.label}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores del negocio">
        <StatsCounter
          label="Servicios activos"
          value={activeServices.length}
          icon={<Wrench className="h-4 w-4" />}
          trend="Órdenes por atender"
        />
        <StatsCounter
          label="Citas de hoy"
          value={appointmentsToday.length}
          icon={<CalendarDays className="h-4 w-4" />}
          trend="Agenda diaria"
        />
        <StatsCounter
          label="Clientes activos"
          value={clients.filter(client => client.activo).length}
          icon={<Users className="h-4 w-4" />}
          trend="Cartera vigente"
        />
        <StatsCounter
          label="Ingresos cobrados"
          value={collected}
          prefix="$"
          suffix=" MXN"
          icon={<ReceiptText className="h-4 w-4" />}
          trend={`$${outstanding.toLocaleString()} MXN por cobrar`}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <GlowCard glowColor="rgba(14, 165, 233, 0.22)" className="!p-0">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-100">
                <CalendarDays className="h-4 w-4 text-sky-400" />
                Agenda próxima
              </h2>
              <p className="mt-1 text-xs text-slate-400">Visitas y trabajos en campo</p>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/10 hover:text-sky-200"
            >
              Ver agenda <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {upcomingAppointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                Aún no hay citas. Las próximas visitas aparecerán aquí cuando las programes.
              </div>
            ) : (
              upcomingAppointments.map((appointment, index) => {
                const service = services.find(item => item.id === appointment.servicioId);
                const client = clients.find(item => item.id === service?.clienteId);
                const gate = gates.find(item => item.id === service?.portonId);
                const isNext = index === 0;

                return (
                  <motion.button
                    key={appointment.id}
                    type="button"
                    onClick={() => onNavigate('calendar')}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.045 }}
                    className={`group w-full rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      isNext
                        ? 'border-sky-500/40 bg-sky-500/[0.08] shadow-[0_0_24px_rgba(14,165,233,0.1)] hover:border-sky-400/60'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                          isNext ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {appointment.fechaAcordada === today ? 'HOY' : appointment.fechaAcordada}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-300">
                          <Clock3 className="h-3.5 w-3.5 text-sky-400" />
                          {appointment.horaInicio}
                        </span>
                      </div>
                      {service && <StatusBadge type="servicio" value={service.estado} />}
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-100">
                          {client?.nombreOrazonSocial || 'Cliente por asignar'}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {service?.codigoFolio} · {service?.tipoServicioId}
                          {gate ? ` · ${gate.marcaMotor} ${gate.modeloMotor}` : ''}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </GlowCard>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <GlowCard glowColor="rgba(16, 185, 129, 0.14)">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estado de operación</p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-100">
                  {operationTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {services.length === 0
                    ? clients.length === 0
                      ? 'El primer paso es agregar los datos de un cliente.'
                      : gates.length === 0
                        ? 'Agrega un portón para habilitar nuevas solicitudes.'
                        : 'Ya puedes registrar un servicio para este portón.'
                    : `${activeServices.length} órdenes abiertas · ${appointmentsToday.length} visitas hoy`}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            {services.length > 0 && (
              <>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-950">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((services.filter(service => service.estado === 'terminado').length / services.length) * 100)}%` }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Servicios concluidos</span>
                  <span>{services.filter(service => service.estado === 'terminado').length} de {services.length}</span>
                </div>
              </>
            )}
          </GlowCard>

          <GlowCard glowColor="rgba(245, 158, 11, 0.14)">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cobranza pendiente</p>
                <h2 className="mt-2 text-2xl font-extrabold text-amber-700">
                  ${outstanding.toLocaleString()} <span className="text-xs font-medium text-slate-400">MXN</span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">Saldo total de órdenes no liquidadas</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                <ReceiptText className="h-5 w-5" />
              </span>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/10"
            >
              Revisar servicios <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </GlowCard>
        </div>
      </section>
    </div>
  );
};
