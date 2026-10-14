import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Porton, TipoPorton } from '../../types';
import { Shield, Plus, Wrench, Calendar, MapPin, History, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useNavigate } from 'react-router';
import { serviceTypeLabels } from '../../utils/labels';

export const GatesView: React.FC = () => {
  const { gates, clients, services, addGate } = useAppStore();
  const navigate = useNavigate();
  const eligibleClients = clients.filter(client => client.activo && client.direcciones.length > 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGateHistory, setSelectedGateHistory] = useState<string | null>(null);

  // Form states
  const [clienteId, setClienteId] = useState(eligibleClients[0]?.id || '');
  const [direccionId, setDireccionId] = useState('');
  const [tipo, setTipo] = useState<TipoPorton | ''>('');
  const [marcaMotor, setMarcaMotor] = useState('');
  const [modeloMotor, setModeloMotor] = useState('');
  const [fechaInstalacion, setFechaInstalacion] = useState('');
  const [notas, setNotas] = useState('');

  const selectedClient = clients.find(c => c.id === clienteId);

  const resetForm = () => {
    setTipo('');
    setMarcaMotor('');
    setModeloMotor('');
    setFechaInstalacion('');
    setNotas('');
    setDireccionId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !direccionId || !tipo || !marcaMotor || !modeloMotor) return;

    addGate({
      clienteId,
      direccionId,
      tipo,
      marcaMotor,
      modeloMotor,
      fechaInstalacion: fechaInstalacion || undefined,
      notas: notas || undefined,
    });

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-400" />
            Portones
          </h2>
          <p className="text-sm text-slate-400">
            Consulta el equipo instalado en cada domicilio y su historial de servicios.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const firstClient = eligibleClients[0];
            setClienteId(firstClient?.id || '');
            setDireccionId(firstClient?.direcciones[0]?.id || '');
            setIsModalOpen(true);
          }}
          disabled={eligibleClients.length === 0}
          title={eligibleClients.length === 0 ? 'Registra un cliente con domicilio antes de agregar un portón' : undefined}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Registrar Portón
        </button>
      </div>

      {/* Gates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {gates.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <Shield aria-hidden="true" className="mx-auto h-7 w-7 text-sky-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">Aún no hay portones registrados</h3>
            <p className="mt-1 text-sm text-slate-400">
              {eligibleClients.length === 0
                ? 'Primero registra un cliente y agrega su domicilio de servicio.'
                : 'Registra un portón para comenzar su historial de mantenimiento.'}
            </p>
            {eligibleClients.length === 0 && (
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Ir a clientes
              </button>
            )}
          </div>
        )}
        {gates.map((gate) => {
          const client = clients.find(c => c.id === gate.clienteId);
          const address = client?.direcciones.find(d => d.id === gate.direccionId);
          const gateServices = services.filter(s => s.portonId === gate.id);
          const isHistoryExpanded = selectedGateHistory === gate.id;

          return (
            <GlowCard key={gate.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-semibold">
                      Tipo: {gate.tipo}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">
                      {gate.marcaMotor} {gate.modeloMotor}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="font-semibold text-slate-100">
                      Cliente: {client?.nombreOrazonSocial || 'Cliente no asignado'}
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{address ? `${address.calleNumero}, ${address.colonia}` : 'Domicilio no especificado'}</span>
                    </div>
                  </div>

                  {gate.fechaInstalacion && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Instalación original: {gate.fechaInstalacion}</span>
                    </div>
                  )}

                  {gate.notas && (
                    <p className="text-[11px] text-slate-400 italic">
                      &ldquo;{gate.notas}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Historial de servicios del portón */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedGateHistory(isHistoryExpanded ? null : gate.id)}
                  className="w-full flex items-center justify-between py-1 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Historial de Servicios ({gateServices.length})
                  </span>
                  {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isHistoryExpanded && (
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 animate-fade-in">
                    {gateServices.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2">Sin historial registrado aún.</p>
                    ) : (
                      gateServices.map((srv) => (
                        <div key={srv.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sky-400 font-semibold">{srv.codigoFolio}</span>
                            <StatusBadge type="servicio" value={srv.estado} />
                          </div>
                          <div className="text-slate-300 capitalize">
                            {serviceTypeLabels[srv.tipoServicioId]}
                          </div>
                          {srv.trabajoRealizado && (
                            <div className="text-slate-400 italic border-l-2 border-emerald-500 pl-2 mt-1">
                              {srv.trabajoRealizado}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Atendido: {srv.fechaRealAtencion || srv.fechaSolicitud}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Modal Registro Porton */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              Registrar portón
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Asociación a un único cliente y selección de su dirección de servicio.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cliente *
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    const c = eligibleClients.find(client => client.id === e.target.value);
                    if (c && c.direcciones.length > 0) {
                      setDireccionId(c.direcciones[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                >
                  {eligibleClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombreOrazonSocial} ({c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Domicilio del portón *
                </label>
                <select
                  required
                  value={direccionId}
                  onChange={(e) => setDireccionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                >
                  {selectedClient?.direcciones.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.calleNumero}, {d.colonia}, {d.ciudad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Tipo de Portón *
                  </label>
                  <select
                    required
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoPorton | '')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 capitalize"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="corredizo">Corredizo</option>
                    <option value="abatible">Abatible</option>
                    <option value="levadizo">Levadizo</option>
                    <option value="seccional">Seccional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Marca del Motor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Marca del motor"
                    value={marcaMotor}
                    onChange={(e) => setMarcaMotor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Modelo del Motor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Modelo del motor"
                    value={modeloMotor}
                    onChange={(e) => setModeloMotor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Fecha de Instalación
                  </label>
                  <input
                    type="date"
                    value={fechaInstalacion}
                    onChange={(e) => setFechaInstalacion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Notas u Observaciones del Portón
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles del portón o notas de instalación"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Registrar Portón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
