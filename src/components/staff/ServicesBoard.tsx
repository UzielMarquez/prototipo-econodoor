import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { EstadoServicio, EstadoPago, TipoServicioId, Servicio } from '../../types';
import { Wrench, Plus, Filter, AlertTriangle, DollarSign, Calendar, Ban, CheckCircle, Clock, Search } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';
import { StatusBadge } from '../ui/StatusBadge';
import { PaymentsModal } from './PaymentsModal';
import { useLocation, useNavigate } from 'react-router';
import { serviceTypeLabels } from '../../utils/labels';

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const ServicesBoard: React.FC = () => {
  const { services, clients, gates, technicians, appointments, catalog, addService, cancelService, getServicePaymentState } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const activeClients = clients.filter(client => client.activo);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const state = location.state as { search?: string } | null;
    if (state?.search) setSearchTerm(state.search);
  }, [location.key, location.state]);

  // Filters (P5.2: simultáneos)
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterTecnico, setFilterTecnico] = useState<string>('all');
  const [filterPago, setFilterPago] = useState<string>('all');

  // Modals
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedServiceToCancel, setSelectedServiceToCancel] = useState<Servicio | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [activePaymentServiceId, setActivePaymentServiceId] = useState<string | null>(null);

  // New Service Form (P3.1 - P3.5)
  const [newClienteId, setNewClienteId] = useState(activeClients[0]?.id || '');
  const [newPortonId, setNewPortonId] = useState('');
  const [newTipoId, setNewTipoId] = useState<TipoServicioId | ''>('');
  const [newCosto, setNewCosto] = useState<number | ''>('');
  const [newFalla, setNewFalla] = useState('');

  const hasEligibleGate = gates.some(gate =>
    activeClients.some(client => client.id === gate.clienteId),
  );
  const canCreateService = activeClients.length > 0 && hasEligibleGate;
  const clientGates = gates.filter(g =>
    g.clienteId === newClienteId && activeClients.some(client => client.id === g.clienteId),
  );

  const handleTipoChange = (tipoId: TipoServicioId) => {
    setNewTipoId(tipoId);
    const item = catalog.find(c => c.id === tipoId);
    setNewCosto(item?.precioBase ?? '');
  };

  const clearServiceForm = () => {
    setNewPortonId('');
    setNewTipoId('');
    setNewCosto('');
    setNewFalla('');
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClienteId || !newPortonId || !newTipoId || newCosto === '' || newCosto <= 0) return;

    addService({
      clienteId: newClienteId,
      portonId: newPortonId,
      tipoServicioId: newTipoId,
      costo: Number(newCosto),
      descripcionFalla: newTipoId === 'correctivo' ? newFalla : undefined,
    });

    setIsNewServiceModalOpen(false);
    clearServiceForm();
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceToCancel || !cancelMotivo) return;

    cancelService(selectedServiceToCancel.id, cancelMotivo);
    setIsCancelModalOpen(false);
    setSelectedServiceToCancel(null);
    setCancelMotivo('');
  };

  const todayStr = getLocalDate();

  const filteredServices = services.filter(s => {
    const payment = getServicePaymentState(s.id);
    const client = clients.find(item => item.id === s.clienteId);
    const gate = gates.find(item => item.id === s.portonId);
    const query = searchTerm.trim().toLowerCase();
    const matchSearch = !query ||
      s.codigoFolio.toLowerCase().includes(query) ||
      client?.nombreOrazonSocial.toLowerCase().includes(query) ||
      gate?.marcaMotor.toLowerCase().includes(query) ||
      gate?.modeloMotor.toLowerCase().includes(query) ||
      s.descripcionFalla?.toLowerCase().includes(query);
    const matchEstado = filterEstado === 'all' || s.estado === filterEstado;
    const matchTipo = filterTipo === 'all' || s.tipoServicioId === filterTipo;
    const matchPago = filterPago === 'all' || payment.estado === filterPago;

    // Buscar técnico asignado
    let matchTecnico = true;
    if (filterTecnico !== 'all') {
      const cita = appointments.find(a => a.servicioId === s.id);
      matchTecnico = cita ? cita.tecnicoId === filterTecnico : false;
    }

    return matchSearch && matchEstado && matchTipo && matchPago && matchTecnico;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-400" />
            Servicios y pagos
          </h2>
          <p className="text-sm text-slate-400">
            Consulta el avance de los trabajos y registra los pagos recibidos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewPortonId(clientGates[0]?.id || '');
            setNewTipoId('');
            setNewCosto('');
            setNewFalla('');
            setIsNewServiceModalOpen(true);
          }}
          disabled={!canCreateService}
          title={!canCreateService
            ? activeClients.length === 0
              ? 'Registra o reactiva un cliente antes de crear un servicio'
              : 'Registra un portón para un cliente activo antes de crear un servicio'
            : undefined}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {/* Filter panel (P5.2) */}
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="search"
          aria-label="Buscar servicios"
          placeholder="Buscar por folio, cliente o portón..."
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-slate-700 bg-white pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Estado de Servicio</label>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 capitalize"
          >
            <option value="all">Todos los estados</option>
            <option value="solicitado">Solicitado</option>
            <option value="programado">Programado</option>
            <option value="en_proceso">En Proceso</option>
            <option value="terminado">Terminado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Tipo de Servicio</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 capitalize"
          >
            <option value="all">Todos los tipos</option>
            <option value="instalacion">Instalación</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Técnico Asignado</label>
          <select
            value={filterTecnico}
            onChange={(e) => setFilterTecnico(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
          >
            <option value="all">Cualquier técnico</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.nombreCompleto}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Estado de pago</label>
          <select
            value={filterPago}
            onChange={(e) => setFilterPago(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 capitalize"
          >
            <option value="all">Todos los pagos</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <Wrench aria-hidden="true" className="mx-auto h-7 w-7 text-sky-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">
              {services.length === 0 ? 'Aún no hay servicios registrados' : 'No se encontraron servicios'}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {services.length === 0
                ? 'Registra un cliente y un portón para poder crear la primera solicitud.'
                : 'Prueba con otros filtros.'}
            </p>
            {services.length === 0 && !canCreateService && (
              <button
                type="button"
                onClick={() => navigate(activeClients.length === 0 ? '/clients' : '/gates')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                {activeClients.length === 0 ? 'Ir a clientes' : 'Ir a portones'}
              </button>
            )}
          </div>
        )}
        {filteredServices.map(srv => {
          const client = clients.find(c => c.id === srv.clienteId);
          const gate = gates.find(g => g.id === srv.portonId);
          const cita = appointments.find(a => a.servicioId === srv.id);
          const tech = technicians.find(t => t.id === cita?.tecnicoId);
          const payment = getServicePaymentState(srv.id);

          // P5.3: El sistema resaltará los servicios cuya fecha acordada ya pasó y que aún no se han marcado como terminados
          const isOverdue = cita && cita.fechaAcordada < todayStr && srv.estado !== 'terminado' && srv.estado !== 'cancelado';

          return (
            <GlowCard 
              key={srv.id} 
              className={`flex flex-col justify-between ${isOverdue ? 'border-rose-500/80 bg-rose-950/20' : ''}`}
            >
              <div>
                {/* Header card with folio & overdue badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {srv.codigoFolio}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300 capitalize">
                      {serviceTypeLabels[srv.tipoServicioId]}
                    </span>
                  </div>

                  {isOverdue && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      ATRASADO
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-base">
                  {client?.nombreOrazonSocial}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Portón: {gate?.marcaMotor} {gate?.modeloMotor} ({gate?.tipo})
                </div>

                {srv.descripcionFalla && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300">
                    <span className="font-semibold text-amber-400">Falla reportada:</span> {srv.descripcionFalla}
                  </div>
                )}

                {/* El avance del trabajo y el pago se muestran por separado. */}
                <div className="flex flex-wrap items-center gap-2 my-3">
                  <StatusBadge type="servicio" value={srv.estado} />
                  <StatusBadge type="pago" value={payment.estado} />
                </div>

                {/* Financial Summary */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Costo Acordado:</span>
                    <strong className="text-slate-100 font-mono">${srv.costo.toLocaleString()} MXN</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Abonado / Pagado:</span>
                    <span className="text-emerald-400 font-mono font-semibold">${payment.totalPagado.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-semibold">Saldo Pendiente:</span>
                    <span className={`font-mono font-bold ${payment.saldoPendiente > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      ${payment.saldoPendiente.toLocaleString()} MXN
                    </span>
                  </div>
                </div>

                {/* Technician info */}
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Técnico: <strong className="text-slate-200">{tech ? tech.nombreCompleto : 'No asignado'}</strong></span>
                  {cita && <span>Cita: {cita.fechaAcordada}</span>}
                </div>

                {srv.motivoCancelacion && (
                  <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
                    <strong>Cancelado:</strong> {srv.motivoCancelacion}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActivePaymentServiceId(srv.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Registrar pago
                </button>

                {srv.estado !== 'cancelado' && srv.estado !== 'terminado' && (
                  <button
                    onClick={() => {
                      setSelectedServiceToCancel(srv);
                      setCancelMotivo('');
                      setIsCancelModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Cancelar servicio"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            </GlowCard>
          );
        })}
      </div>

      {isNewServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" /> Nueva solicitud de servicio
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Selecciona el cliente, portón a atender y tarifa base editable.
            </p>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cliente *
                </label>
                <select
                  value={newClienteId}
                  onChange={(e) => {
                    setNewClienteId(e.target.value);
                    const matchingGates = gates.filter(g => g.clienteId === e.target.value);
                    if (matchingGates.length > 0) {
                      setNewPortonId(matchingGates[0].id);
                    } else {
                      setNewPortonId('');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                >
                  {activeClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombreOrazonSocial} ({c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Portón a Atender *
                </label>
                {clientGates.length === 0 ? (
                  <p className="text-xs text-amber-400 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    Este cliente aún no tiene portones registrados. Registra uno primero en la sección de Portones.
                  </p>
                ) : (
                  <select
                    value={newPortonId}
                    onChange={(e) => setNewPortonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100"
                  >
                    {clientGates.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.marcaMotor} {g.modeloMotor} ({g.tipo})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Tipo de Servicio *
                  </label>
                  <select
                    required
                    value={newTipoId}
                    onChange={(e) => handleTipoChange(e.target.value as TipoServicioId)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 capitalize"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="instalacion">Instalación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Costo acordado (MXN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCosto}
                      onChange={(e) => setNewCosto(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {newTipoId === 'correctivo' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                    Falla reportada *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe los síntomas reportados..."
                    value={newFalla}
                    onChange={(e) => setNewFalla(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-slate-100"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewServiceModalOpen(false);
                    clearServiceForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientGates.length === 0}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCancelModalOpen && selectedServiceToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-400" /> Cancelar servicio
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Folio: <strong className="text-slate-100 font-mono">{selectedServiceToCancel.codigoFolio}</strong>. El registro se conservará y sus citas futuras quedarán canceladas automáticamente.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-rose-300 uppercase mb-1">
                  Motivo Obligatorio de Cancelación *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe el motivo de cancelación..."
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/30"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagos */}
      {activePaymentServiceId && (
        <PaymentsModal
          servicioId={activePaymentServiceId}
          onClose={() => setActivePaymentServiceId(null)}
        />
      )}
    </div>
  );
};
