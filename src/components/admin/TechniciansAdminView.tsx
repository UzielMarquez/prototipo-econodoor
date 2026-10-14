import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DisponibilidadSemanal, HorarioDia, Tecnico, Cita } from '../../types';
import { Users, Plus, Clock, AlertTriangle, ShieldCheck, Phone, CheckCircle2, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';
import { useNavigate } from 'react-router';

const weekdays: { key: keyof DisponibilidadSemanal; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const emptyAvailability: DisponibilidadSemanal = {
  lunes: { activo: false, horaInicio: '', horaFin: '' },
  martes: { activo: false, horaInicio: '', horaFin: '' },
  miercoles: { activo: false, horaInicio: '', horaFin: '' },
  jueves: { activo: false, horaInicio: '', horaFin: '' },
  viernes: { activo: false, horaInicio: '', horaFin: '' },
  sabado: { activo: false, horaInicio: '', horaFin: '' },
  domingo: { activo: false, horaInicio: '', horaFin: '' },
};

export const TechniciansAdminView: React.FC = () => {
  const { technicians, addTechnician, toggleTechnicianStatus, appointments, services, clients } = useAppStore();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [affectedAppointments, setAffectedAppointments] = useState<Cita[]>([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);

  // New tech form
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadSemanal>(emptyAvailability);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const updateAvailability = (
    day: keyof DisponibilidadSemanal,
    changes: Partial<HorarioDia>,
  ) => {
    setDisponibilidad(current => ({
      ...current,
      [day]: { ...current[day], ...changes },
    }));
    setScheduleError(null);
  };

  const handleToggleActive = (techId: string) => {
    const { affectedAppointments: affected } = toggleTechnicianStatus(techId);
    if (affected.length > 0) {
      setAffectedAppointments(affected);
      setShowAffectedModal(true);
    }
  };

  const handleCreateTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto || !telefono) return;

    const activeDays = weekdays
      .map(day => disponibilidad[day.key])
      .filter(day => day.activo);
    if (activeDays.length === 0) {
      setScheduleError('Selecciona días y horarios.');
      return;
    }
    if (activeDays.some(day => !day.horaInicio || !day.horaFin || day.horaInicio >= day.horaFin)) {
      setScheduleError('Horario inválido.');
      return;
    }

    addTechnician({
      nombreCompleto,
      telefono,
      activo: true,
      especialidad: especialidad.trim() || 'Sin especificar',
      disponibilidad: {
        lunes: { ...disponibilidad.lunes },
        martes: { ...disponibilidad.martes },
        miercoles: { ...disponibilidad.miercoles },
        jueves: { ...disponibilidad.jueves },
        viernes: { ...disponibilidad.viernes },
        sabado: { ...disponibilidad.sabado },
        domingo: { ...disponibilidad.domingo },
      },
    });

    setIsAddModalOpen(false);
    setNombreCompleto('');
    setTelefono('');
    setEspecialidad('');
    setDisponibilidad(emptyAvailability);
    setScheduleError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Técnicos y horarios
          </h2>
          <p className="text-sm text-slate-400">
            Administra al equipo y define cuándo puede recibir citas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          Registrar Técnico
        </button>
      </div>

      {/* Grid of technicians */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {technicians.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <Users aria-hidden="true" className="mx-auto h-7 w-7 text-sky-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">Aún no hay técnicos registrados</h3>
            <p className="mt-1 text-sm text-slate-400">
              Registra al equipo para configurar sus horarios y asignarles citas.
            </p>
          </div>
        )}
        {technicians.map((tech) => {
          const techAppointments = appointments.filter(a => a.tecnicoId === tech.id);

          return (
            <GlowCard key={tech.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg">{tech.nombreCompleto}</h3>
                    <p className="text-xs text-sky-400 font-medium">{tech.especialidad}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tech.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                    {tech.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-mono">{tech.telefono}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Horario semanal
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {weekdays.map(({ key, label }) => {
                        const cfg = tech.disponibilidad[key];
                        return (
                        <div
                          key={key}
                          className={`rounded-lg px-2 py-1.5 text-xs ${
                            cfg.activo
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <span className="font-semibold">{label}</span>
                          <span className="ml-1">{cfg.activo ? `${cfg.horaInicio}–${cfg.horaFin}` : 'No trabaja'}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {techAppointments.length} citas asignadas
                </span>
                <button
                  onClick={() => handleToggleActive(tech.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tech.activo
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  }`}
                  title={tech.activo ? 'Desactivar técnico' : 'Reactivar técnico'}
                >
                  {tech.activo ? 'Desactivar Técnico' : 'Reactivar'}
                </button>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {showAffectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Citas futuras afectadas
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Este técnico tenía <strong className="text-amber-400">{affectedAppointments.length} citas futuras programadas</strong>. Asígnalas a otro técnico activo.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-5">
              {affectedAppointments.map(cita => {
                const srv = services.find(s => s.id === cita.servicioId);
                const client = clients.find(c => c.id === srv?.clienteId);
                return (
                  <div key={cita.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sky-400 font-bold">{srv?.codigoFolio} - {client?.nombreOrazonSocial}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Fecha: {cita.fechaAcordada} a las {cita.horaInicio}</div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Requiere Reasignación
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAffectedModal(false);
                  navigate('/calendar');
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20"
              >
                Ir a la agenda para reasignar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" /> Registrar técnico
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Agrega sus datos de contacto y los días y horarios en que trabaja.
            </p>

            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Teléfono *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Número telefónico"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Especialidad / Perfil
                </label>
                <input
                  type="text"
                  placeholder="Especialidad (opcional)"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                />
              </div>

              <fieldset className="space-y-2 rounded-xl border border-slate-800 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-300">Horario semanal *</legend>
                {weekdays.map(({ key, label }) => {
                  const day = disponibilidad[key];
                  return (
                    <div key={key} className="grid grid-cols-[minmax(90px,1fr)_1fr_1fr] items-center gap-2">
                      <label className="flex min-h-10 items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={day.activo}
                          onChange={event => updateAvailability(key, {
                            activo: event.target.checked,
                          })}
                          className="h-4 w-4 accent-[#1F4E6B]"
                        />
                        {label}
                      </label>
                      <label className="text-[10px] text-slate-400">
                        Desde
                        <input
                          type="time"
                          aria-label={`${label}: hora de inicio`}
                          required={day.activo}
                          disabled={!day.activo}
                          value={day.horaInicio}
                          onChange={event => updateAvailability(key, { horaInicio: event.target.value })}
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100 disabled:opacity-50"
                        />
                      </label>
                      <label className="text-[10px] text-slate-400">
                        Hasta
                        <input
                          type="time"
                          aria-label={`${label}: hora de término`}
                          required={day.activo}
                          disabled={!day.activo}
                          value={day.horaFin}
                          onChange={event => updateAvailability(key, { horaFin: event.target.value })}
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100 disabled:opacity-50"
                        />
                      </label>
                    </div>
                  );
                })}
              </fieldset>
              {scheduleError && (
                <p className="text-xs font-medium text-rose-400" role="alert">{scheduleError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Guardar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
