import React, { useState, useEffect } from 'react';
import { Search, X, Eraser, User, Wrench, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clientTypeLabels, serviceTypeLabels } from '../../utils/labels';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (clientId: string) => void;
  onSelectService?: (serviceId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectClient, onSelectService }) => {
  const [query, setQuery] = useState('');
  const { clients, services, gates } = useAppStore();

  useEffect(() => {
    if (!isOpen) setQuery('');
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // P1.4: El buscador de clientes aceptará nombre, razón social, teléfono o dirección como criterio
  const matchingClients = q ? clients.filter(c => 
    c.nombreOrazonSocial.toLowerCase().includes(q) ||
    (c.nombreContacto && c.nombreContacto.toLowerCase().includes(q)) ||
    c.telefono.includes(q) ||
    c.direcciones.some(d => d.calleNumero.toLowerCase().includes(q) || d.colonia.toLowerCase().includes(q))
  ) : [];

  const matchingServices = q ? services.filter(s => 
    s.codigoFolio.toLowerCase().includes(q) ||
    (s.descripcionFalla && s.descripcionFalla.toLowerCase().includes(q)) ||
    clients.find(client => client.id === s.clienteId)?.nombreOrazonSocial.toLowerCase().includes(q) ||
    gates.find(gate => gate.id === s.portonId)?.marcaMotor.toLowerCase().includes(q) ||
    gates.find(gate => gate.id === s.portonId)?.modeloMotor.toLowerCase().includes(q)
  ) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar clientes y servicios"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#1D2935]/55 backdrop-blur-md animate-fade-in"
    >
      <div 
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-800 p-4 sm:p-5">
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 transition-colors focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-sky-400" />
            <input
              type="text"
              aria-label="Buscar clientes y servicios"
              placeholder="Buscar por nombre, teléfono, domicilio o folio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setQuery('')}
              disabled={!query}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3.5 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser aria-hidden="true" className="h-4 w-4" />
              Limpiar búsqueda
            </button>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                Pulsa <kbd className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 font-mono font-semibold text-slate-100">ESC</kbd> para cerrar
              </span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1F4E6B] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#286486] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Cerrar búsqueda
              </button>
            </div>
          </div>
        </div>

        {/* Results view */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              <p>Comienza a escribir para buscar en el sistema de Econodoor.</p>
              <div className="flex justify-center gap-2 mt-3 text-xs text-slate-400">
                <span className="bg-slate-800/80 px-2 py-1 rounded">Clientes</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">Direcciones</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded">Folios de Servicio</span>
              </div>
            </div>
          ) : (
            <>
              {matchingClients.length === 0 && matchingServices.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No se encontraron resultados para &ldquo;{query}&rdquo;.
                </div>
              )}

              {matchingClients.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Clientes Encontrados ({matchingClients.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (onSelectClient) onSelectClient(c.id);
                          onClose();
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-left transition-colors hover:border-sky-500/50 hover:bg-slate-800"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            {c.nombreOrazonSocial}
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                              {clientTypeLabels[c.tipo]}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Tel: {c.telefono} • {c.direcciones[0]?.colonia || 'Sin domicilio'}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchingServices.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Servicios y Órdenes ({matchingServices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingServices.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (onSelectService) onSelectService(s.id);
                          onClose();
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 text-left transition-colors hover:border-sky-500/50 hover:bg-slate-800"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                            <span className="font-mono text-sky-400">{s.codigoFolio}</span>
                            <span className="text-xs text-slate-400">{serviceTypeLabels[s.tipoServicioId]}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {clients.find(client => client.id === s.clienteId)?.nombreOrazonSocial}
                            {s.descripcionFalla ? ` · ${s.descripcionFalla}` : ''}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 font-mono text-slate-300 capitalize">
                          {s.estado}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
