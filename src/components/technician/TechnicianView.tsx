import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Cita, Servicio, ElementoChecklist } from '../../types';
import { Wrench, CheckCircle2, Clock, MapPin, Play, AlertCircle, History, ListChecks } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { serviceTypeLabels } from '../../utils/labels';

const getLocalDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const createEmptyChecklist = (): ElementoChecklist[] => [
  { id: 'chk-1', nombre: 'Motor y transmisión eléctrica', estado: '' },
  { id: 'chk-2', nombre: 'Cadena, cremallera o cable de tracción', estado: '' },
  { id: 'chk-3', nombre: 'Sensores fotocelda y reversa de seguridad', estado: '' },
  { id: 'chk-4', nombre: 'Rodamientos, bisagras y topes mecánicos', estado: '' },
  { id: 'chk-5', nombre: 'Controles remotos y botonera de pared', estado: '' },
  { id: 'chk-6', nombre: 'Lubricación general con teflón', estado: '' },
];

const checklistStatusLabels = {
  correcto: 'Correcto',
  requiere_ajuste: 'Requiere ajuste',
  danado: 'Dañado',
};

export const TechnicianView: React.FC = () => {
  const { 
    currentUser, 
    technicians, 
    appointments, 
    services, 
    clients, 
    gates, 
    updateServiceStatusByTech, 
    completeServiceByTech 
  } = useAppStore();

  // Find tech entity
  const tech = technicians.find(t => t.id === currentUser.technicianId);

  // T1.1: Consultar ÚNICAMENTE las citas que tiene asignadas
  const myAppointments = (tech ? appointments.filter(a => a.tecnicoId === tech.id) : [])
    .sort((a, b) => (a.fechaAcordada + a.horaInicio).localeCompare(b.fechaAcordada + b.horaInicio));

  // Active appointment for execution (T2)
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [selectedGateHistoryId, setSelectedGateHistoryId] = useState<string | null>(null);

  const [trabajoRealizado, setTrabajoRealizado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaRealAtencion, setFechaRealAtencion] = useState(getLocalDate);
  const [checklist, setChecklist] = useState<ElementoChecklist[]>(createEmptyChecklist);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCita = appointments.find(a => a.id === activeAppointmentId);
  const activeService = services.find(s => s.id === activeCita?.servicioId);
  const activeGate = gates.find(g => g.id === activeService?.portonId);
  const activeClient = clients.find(c => c.id === activeService?.clienteId);

  const clearWorkForm = () => {
    setTrabajoRealizado('');
    setObservaciones('');
    setFechaRealAtencion(getLocalDate());
    setChecklist(createEmptyChecklist());
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const leaveWork = () => {
    clearWorkForm();
    setActiveAppointmentId(null);
  };

  const handleStartJob = (serviceId: string) => {
    // T2.1: Al atender una cita, el técnico podrá marcar el servicio como "en proceso"
    updateServiceStatusByTech(serviceId, 'en_proceso');
  };

  const handleOpenJob = (cita: Cita, service: Servicio) => {
    clearWorkForm();
    setActiveAppointmentId(cita.id);
    if (service.estado === 'programado') {
      handleStartJob(service.id);
    }
  };

  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (activeService.tipoServicioId === 'preventivo' && checklist.some(item => !item.estado)) {
      setErrorMessage('Selecciona el resultado de cada punto de la lista de verificación.');
      return;
    }

    // T2.4: Validar descripción obligatoria
    const result = completeServiceByTech(activeService.id, {
      trabajoRealizado,
      checklist: activeService.tipoServicioId === 'preventivo' ? checklist : undefined,
      observaciones,
      fechaRealAtencion,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Error al completar el servicio.');
    } else {
      setSuccessMessage('Servicio completado y agregado al historial.');
      setTimeout(() => {
        leaveWork();
      }, 2000);
    }
  };

  if (!tech) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-14 text-center">
        <Wrench aria-hidden="true" className="mx-auto h-8 w-8 text-sky-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-100">Aún no hay técnicos registrados</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
          Pide al administrador que registre tu perfil y te asigne tus primeros trabajos.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <Wrench className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mi agenda</p>
              <h2 className="text-lg font-bold text-slate-100">{tech.nombreCompleto}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Trabajos asignados</span>
            <div className="text-2xl font-black font-mono text-sky-400">
              {myAppointments.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Job List vs Active Job Execution */}
      {!activeAppointmentId ? (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" /> Mis trabajos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAppointments.map((cita) => {
              const srv = services.find(s => s.id === cita.servicioId);
              const client = clients.find(c => c.id === srv?.clienteId);
              const gate = gates.find(g => g.id === srv?.portonId);
              const address = client?.direcciones.find(d => d.id === gate?.direccionId);

              if (!srv) return null;

              return (
                <div
                  key={cita.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg hover:border-sky-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      {srv.codigoFolio}
                    </span>
                    <StatusBadge type="servicio" value={srv.estado} />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-100">
                      {client?.nombreOrazonSocial}
                    </h4>
                    <div className="text-xs text-sky-400 font-semibold uppercase mt-0.5">
                      {serviceTypeLabels[srv.tipoServicioId]} • {gate?.tipo} ({gate?.marcaMotor} {gate?.modeloMotor})
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-mono">
                      <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> {cita.horaInicio} ({cita.duracionMinutos} min)
                      </span>
                      <span>{cita.fechaAcordada}</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{address ? `${address.calleNumero}, ${address.colonia} (${address.ciudad})` : 'Dirección pendiente'}</span>
                    </div>

                    {srv.descripcionFalla && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                        <strong>Falla Reportada:</strong> {srv.descripcionFalla}
                      </div>
                    )}
                  </div>

                  {/* Actions for Technician */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedGateHistoryId(selectedGateHistoryId === gate?.id ? null : (gate?.id || null))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Ver antecedentes del portón"
                    >
                      <History className="w-3.5 h-3.5 text-sky-400" />
                      Antecedentes del portón
                    </button>

                    {srv.estado !== 'terminado' && srv.estado !== 'cancelado' && (
                      <button
                        onClick={() => handleOpenJob(cita, srv)}
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {srv.estado === 'en_proceso' ? 'Continuar Trabajo' : 'Iniciar Trabajo'}
                      </button>
                    )}
                  </div>

                  {/* Antecedentes de trabajos previos del portón */}
                  {selectedGateHistoryId === gate?.id && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 text-xs space-y-2 animate-fade-in">
                      <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                        <History className="w-4 h-4" /> Antecedentes de Mantenimiento ({gate?.marcaMotor}):
                      </div>
                      {services.filter(s => s.portonId === gate?.id && s.id !== srv.id).length === 0 ? (
                        <p className="text-slate-500 italic text-[11px]">No hay servicios anteriores registrados para este portón.</p>
                      ) : (
                        services
                          .filter(s => s.portonId === gate?.id && s.id !== srv.id)
                          .map(prevSrv => (
                            <div key={prevSrv.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                              <div className="flex justify-between font-mono text-slate-300">
                                <span>{prevSrv.codigoFolio} • {serviceTypeLabels[prevSrv.tipoServicioId]}</span>
                                <span>{prevSrv.fechaRealAtencion || prevSrv.fechaSolicitud}</span>
                              </div>
                              <p className="text-slate-400 mt-1 italic">&ldquo;{prevSrv.trabajoRealizado || 'Sin detalle de labor'}&rdquo;</p>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Servicio en curso */
        <div className="max-w-3xl mx-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Servicio {activeService?.codigoFolio}
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {activeClient?.nombreOrazonSocial}
              </h3>
              <p className="text-xs text-slate-400">
                Portón: {activeGate?.marcaMotor} {activeGate?.modeloMotor} ({activeGate?.tipo})
              </p>
            </div>

            <button
              onClick={leaveWork}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              ← Descartar y volver
            </button>
          </div>

          <form onSubmit={handleCompleteJob} className="space-y-5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Fecha acordada en cita:</span>
                <strong className="text-slate-100 ml-2 font-mono">{activeCita?.fechaAcordada}</strong>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="service-completion-date" className="text-slate-400 font-semibold">Fecha de atención:</label>
                <input
                  id="service-completion-date"
                  type="date"
                  required
                  value={fechaRealAtencion}
                  onChange={(e) => setFechaRealAtencion(e.target.value)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs"
                />
              </div>
            </div>

            {activeService?.tipoServicioId === 'preventivo' && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Lista de revisión preventiva
                  </h4>
                  <span className="text-[10px] text-slate-400">6 puntos de inspección</span>
                </div>

                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-slate-200 font-medium">{item.nombre}</span>
                      <div className="flex items-center gap-1.5">
                        {(Object.keys(checklistStatusLabels) as Array<keyof typeof checklistStatusLabels>).map((st) => (
                          <button
                            key={st}
                            type="button"
                            aria-pressed={item.estado === st}
                            onClick={() => {
                              const updated = [...checklist];
                              updated[index].estado = st;
                              setChecklist(updated);
                            }}
                            className={`min-h-11 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              item.estado === st
                                ? st === 'correcto' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' :
                                  st === 'requiere_ajuste' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' :
                                  'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {checklistStatusLabels[st]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-100 uppercase mb-1">
                Trabajo realizado *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Resume el trabajo, las piezas cambiadas y las pruebas realizadas."
                value={trabajoRealizado}
                onChange={(e) => setTrabajoRealizado(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Observaciones adicionales */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Observaciones para el cliente (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Anota recomendaciones o tareas que convenga revisar más adelante."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit closing button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={leaveWork}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Descartar y volver
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Completar servicio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
