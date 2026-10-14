import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Cita, Tecnico, TipoServicioId } from '../../types';
import { Calendar as CalendarIcon, Clock, User, AlertCircle, Plus, ChevronLeft, ChevronRight, Edit3, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';
import { useNavigate } from 'react-router';
import { serviceTypeLabels } from '../../utils/labels';

const getLocalDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    appointments, 
    technicians, 
    services, 
    clients, 
    gates, 
    catalog,
    bookAppointment, 
    rescheduleAppointment, 
    reassignAppointment, 
    checkTechnicianAvailability 
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [activeCita, setActiveCita] = useState<Cita | null>(null);

  // Booking form state
  const unassignedServices = services.filter(s =>
    !s.citaId && s.estado !== 'cancelado' && s.estado !== 'terminado',
  );
  const [selectedServiceId, setSelectedServiceId] = useState(unassignedServices[0]?.id || '');
  const activeTechnicians = technicians.filter(technician => technician.activo);
  const [bookTechId, setBookTechId] = useState(activeTechnicians[0]?.id || '');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState<number | ''>('');
  const [bookError, setBookError] = useState<string | null>(null);

  // Reschedule form state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleMotivo, setRescheduleMotivo] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Reassign form state
  const [newTechId, setNewTechId] = useState('');
  const [reassignMotivo, setReassignMotivo] = useState('');
  const [reassignError, setReassignError] = useState<string | null>(null);

  const handleSelectServiceToBook = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const srv = services.find(s => s.id === serviceId);
    if (srv) {
      const cat = catalog.find(c => c.id === srv.tipoServicioId);
      setBookDuration(cat?.duracionMinutos ?? '');
    }
  };

  const openBookingForm = () => {
    const firstService = unassignedServices[0];
    setSelectedServiceId(firstService?.id || '');
    setBookTechId(activeTechnicians[0]?.id || '');
    setBookDate('');
    setBookTime('');
    setBookDuration(
      firstService
        ? catalog.find(item => item.id === firstService.tipoServicioId)?.duracionMinutos ?? ''
        : '',
    );
    setBookError(null);
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    if (!selectedServiceId || !bookTechId || !bookDate || !bookTime || bookDuration === '') return;

    const result = bookAppointment({
      servicioId: selectedServiceId,
      tecnicoId: bookTechId,
      fecha: bookDate,
      horaInicio: bookTime,
      duracionMinutos: bookDuration,
    });

    if (!result.success) {
      setBookError(result.error || 'No se pudo agendar.');
    } else {
      setIsBookModalOpen(false);
      setBookError(null);
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCita || !newDate || !newTime || !rescheduleMotivo) return;

    const result = rescheduleAppointment(activeCita.id, newDate, newTime, rescheduleMotivo);
    if (!result.success) {
      setRescheduleError(result.error || 'No se pudo reprogramar.');
    } else {
      setIsRescheduleModalOpen(false);
      setRescheduleError(null);
      setActiveCita(null);
    }
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCita || !newTechId || !reassignMotivo) return;

    const result = reassignAppointment(activeCita.id, newTechId, reassignMotivo);
    if (!result.success) {
      setReassignError(result.error || 'No se pudo reasignar.');
    } else {
      setIsReassignModalOpen(false);
      setReassignError(null);
      setActiveCita(null);
    }
  };

  const selectedDateValue = new Date(`${selectedDate || getLocalDate()}T00:00:00`);
  const dayOfWeek = selectedDateValue.getDay() || 7;
  const weekStart = new Date(selectedDateValue);
  weekStart.setDate(selectedDateValue.getDate() - dayOfWeek + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const periodStart = viewMode === 'day'
    ? selectedDate
    : viewMode === 'week'
      ? getLocalDate(weekStart)
      : `${selectedDate.slice(0, 7)}-01`;
  const periodEnd = viewMode === 'day'
    ? selectedDate
    : viewMode === 'week'
      ? getLocalDate(weekEnd)
      : `${selectedDate.slice(0, 7)}-31`;

  const filteredAppointments = appointments.filter(a => {
    const srv = services.find(s => s.id === a.servicioId);
    const matchDate = a.fechaAcordada >= periodStart && a.fechaAcordada <= periodEnd;
    const matchTech = selectedTechFilter === 'all' || a.tecnicoId === selectedTechFilter;
    const matchType = selectedTypeFilter === 'all' || (srv && srv.tipoServicioId === selectedTypeFilter);
    return matchDate && matchTech && matchType;
  }).sort((a, b) =>
    `${a.fechaAcordada}${a.horaInicio}`.localeCompare(`${b.fechaAcordada}${b.horaInicio}`),
  );

  return (
    <div className="space-y-6">
      {/* Header and Quick Book Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
            Agenda de citas
          </h2>
          <p className="text-sm text-slate-400">
            Revisa las visitas por día, semana o mes, y asigna un técnico disponible.
          </p>
        </div>

        <button
          onClick={openBookingForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Agendar Nueva Cita
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`min-h-10 px-3 py-1 rounded-md font-medium capitalize ${viewMode === mode ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          {/* Technician selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Técnico:</span>
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            >
              <option value="all">Todos los técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.nombreCompleto} {!t.activo && '(Inactivo)'}</option>
              ))}
            </select>
          </div>

          {/* Service type filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tipo de Servicio:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none capitalize"
            >
              <option value="all">Todos los tipos</option>
              <option value="instalacion">Instalación</option>
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Appointments List / Visual Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-800">
            <p>
              {appointments.length === 0
                ? unassignedServices.length === 0
                  ? 'Aún no hay servicios pendientes para agendar.'
                  : activeTechnicians.length === 0
                    ? 'No hay técnicos activos. Pide al administrador que configure al equipo para continuar.'
                    : 'Ya puedes agendar una visita para uno de los servicios pendientes.'
                : 'No hay citas para este período o con los filtros seleccionados.'}
            </p>
            {appointments.length === 0 && unassignedServices.length === 0 && (
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Ir a servicios
              </button>
            )}
            {appointments.length === 0 && unassignedServices.length > 0 && activeTechnicians.length > 0 && (
              <button
                type="button"
                onClick={openBookingForm}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Agendar primera cita
              </button>
            )}
            {appointments.length === 0 && unassignedServices.length > 0 && activeTechnicians.length === 0 && currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin/technicians')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Configurar técnicos
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map(cita => {
            const srv = services.find(s => s.id === cita.servicioId);
            const client = clients.find(c => c.id === srv?.clienteId);
            const gate = gates.find(g => g.id === srv?.portonId);
            const tech = technicians.find(t => t.id === cita.tecnicoId);
            const address = client?.direcciones.find(d => d.id === gate?.direccionId);

            return (
              <GlowCard key={cita.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {srv?.codigoFolio}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      cita.estado === 'programada' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' :
                      cita.estado === 'atendida' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}>
                      {cita.estado}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base">
                    {client?.nombreOrazonSocial}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 capitalize">
                    {srv ? serviceTypeLabels[srv.tipoServicioId] : ''} • {gate?.marcaMotor} ({gate?.tipo})
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> {cita.horaInicio} ({cita.duracionMinutos} min)
                      </span>
                      <span className="text-slate-400 font-mono">{cita.fechaAcordada}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Técnico: <strong className="text-slate-100">{tech?.nombreCompleto}</strong></span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {address ? `${address.calleNumero}, ${address.colonia}` : 'Domicilio cliente'}
                    </div>

                    {cita.motivoReprogramacion && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px]">
                        <strong>Reprogramada:</strong> {cita.motivoReprogramacion} (Original: {cita.fechaOriginalmenteAcordada})
                      </div>
                    )}
                  </div>
                </div>

                {cita.estado === 'programada' && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setActiveCita(cita);
                        setNewDate(cita.fechaAcordada);
                        setNewTime(cita.horaInicio);
                        setRescheduleMotivo('');
                        setRescheduleError(null);
                        setIsRescheduleModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                      title="Reprogramar fecha y hora"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" /> Reprogramar
                    </button>

                    <button
                      disabled={activeTechnicians.filter(t => t.id !== cita.tecnicoId).length === 0}
                      onClick={() => {
                        setActiveCita(cita);
                        setNewTechId(activeTechnicians.find(t => t.id !== cita.tecnicoId)?.id || '');
                        setReassignMotivo('');
                        setReassignError(null);
                        setIsReassignModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                      title="Reasignar a otro técnico"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" /> Reasignar
                    </button>
                  </div>
                )}
              </GlowCard>
            );
          })
        )}
      </div>

      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              Agendar cita
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Selecciona un servicio, un horario y un técnico disponible.
            </p>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Servicio a Agendar *
                </label>
                {unassignedServices.length === 0 ? (
                  <p className="text-xs text-amber-400 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    No hay servicios pendientes de agendar. Registra una solicitud de servicio primero.
                  </p>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleSelectServiceToBook(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  >
                    {unassignedServices.map(s => {
                      const client = clients.find(c => c.id === s.clienteId);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.codigoFolio} - {client?.nombreOrazonSocial} ({serviceTypeLabels[s.tipoServicioId]})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Técnico *
                </label>
                {activeTechnicians.length === 0 ? (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-700">
                    No hay técnicos activos. Pide al administrador que registre al equipo y sus horarios.
                  </p>
                ) : (
                  <select
                    required
                    value={bookTechId}
                    onChange={(e) => setBookTechId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  >
                  {activeTechnicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto} ({t.especialidad})
                    </option>
                  ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Duración (Min) *
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={bookDuration}
                    onChange={(e) => setBookDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
              </div>

              {bookError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{bookError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={unassignedServices.length === 0 || activeTechnicians.length === 0 || !bookDate || !bookTime || bookDuration === ''}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reprogramar cita */}
      {isRescheduleModalOpen && activeCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-sky-400" /> Reprogramar cita
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Fecha original registrada: <strong className="text-slate-100 font-mono">{activeCita.fechaAcordada} {activeCita.horaInicio}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nueva Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nueva Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Motivo de la reprogramación *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Motivo de la reprogramación..."
                  value={rescheduleMotivo}
                  onChange={(e) => setRescheduleMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              {rescheduleError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Guardar Reprogramación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reasignar técnico */}
      {isReassignModalOpen && activeCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-sky-400" /> Reasignar a otro técnico
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cita para el <strong className="text-slate-100 font-mono">{activeCita.fechaAcordada}</strong> a las <strong className="text-slate-100 font-mono">{activeCita.horaInicio}</strong>
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nuevo Técnico Responsable *
                </label>
                <select
                  value={newTechId}
                  onChange={(e) => setNewTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                >
                  {technicians.filter(t => t.activo).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto} {t.id === activeCita.tecnicoId ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Motivo de la reasignación *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Motivo de la reasignación..."
                  value={reassignMotivo}
                  onChange={(e) => setReassignMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              {reassignError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{reassignError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Confirmar Reasignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
