import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShieldCheck, History, Edit, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { serviceTypeLabels } from '../../utils/labels';

export const AuditLogView: React.FC = () => {
  const { auditLogs, services, adminCorrectService } = useAppStore();
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [trabajoCorregido, setTrabajoCorregido] = useState('');
  const [observacionesCorregidas, setObservacionesCorregidas] = useState('');
  const [motivoCorreccion, setMotivoCorreccion] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(false);

  // Servicios terminados / cerrados (A4.1)
  const closedServices = services.filter(s => s.estado === 'terminado');

  const handleOpenCorrection = () => {
    if (closedServices.length > 0) {
      const s = closedServices[0];
      setSelectedServiceId(s.id);
      setTrabajoCorregido(s.trabajoRealizado || '');
      setObservacionesCorregidas(s.observacionesTecnico || '');
      setMotivoCorreccion('');
      setIsCorrectionModalOpen(true);
    }
  };

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    const s = services.find(srv => srv.id === id);
    if (s) {
      setTrabajoCorregido(s.trabajoRealizado || '');
      setObservacionesCorregidas(s.observacionesTecnico || '');
    }
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !motivoCorreccion.trim()) return;

    adminCorrectService(
      selectedServiceId,
      {
        trabajoRealizado: trabajoCorregido,
        observacionesTecnico: observacionesCorregidas,
      },
      motivoCorreccion
    );

    setIsCorrectionModalOpen(false);
    setFeedbackMsg(true);
    setTimeout(() => setFeedbackMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
            Bitácora de cambios
          </h2>
          <p className="text-sm text-slate-400">
            Consulta las modificaciones y los motivos registrados en los servicios.
          </p>
        </div>

        <button
          onClick={handleOpenCorrection}
          disabled={closedServices.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition-all"
        >
          <Edit className="w-4 h-4" />
          Corregir trabajo terminado
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>¡Corrección aplicada con éxito y registrada de forma inalterable en la bitácora de auditoría!</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" /> Registros de Auditoría ({auditLogs.length})
          </span>
          <span className="text-[11px] text-slate-500">
          Los cambios quedan registrados en esta bitácora.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Responsable</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5">Registro</th>
                <th className="p-3.5">Antes</th>
                <th className="p-3.5">Después</th>
                <th className="p-3.5">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-sans text-sm text-slate-400">
                    La bitácora está vacía. Las acciones realizadas durante esta sesión aparecerán aquí.
                  </td>
                </tr>
              )}
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">{log.fechaHora}</td>
                  <td className="p-3.5 font-sans font-semibold text-slate-100 whitespace-nowrap">{log.usuario}</td>
                  <td className="p-3.5 font-sans font-medium text-sky-400 whitespace-nowrap">{log.accion}</td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap">{log.entidadAfectada}</td>
                  <td className="p-3.5 text-slate-400 max-w-xs truncate" title={log.valorAnterior}>
                    {log.valorAnterior || '—'}
                  </td>
                  <td className="p-3.5 text-emerald-400 max-w-xs truncate" title={log.valorNuevo}>
                    {log.valorNuevo || '—'}
                  </td>
                  <td className="p-3.5 font-sans text-amber-300/90 italic max-w-xs truncate" title={log.motivo}>
                    {log.motivo || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-400" /> Corregir trabajo terminado
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Indica qué debe corregirse y por qué. El cambio quedará registrado en la bitácora.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Servicio Cerrado a Corregir *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => handleSelectService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                >
                  {closedServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.codigoFolio} - ${s.costo.toLocaleString('es-MX')} ({serviceTypeLabels[s.tipoServicioId]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Descripción Corregida del Trabajo Realizado *
                </label>
                <textarea
                  required
                  rows={3}
                  value={trabajoCorregido}
                  onChange={(e) => setTrabajoCorregido(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Observaciones Corregidas
                </label>
                <textarea
                  rows={2}
                  value={observacionesCorregidas}
                  onChange={(e) => setObservacionesCorregidas(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                  Motivo de la corrección *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Describe el motivo de la corrección..."
                  value={motivoCorreccion}
                  onChange={(e) => setMotivoCorreccion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30"
                >
                  Aplicar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
