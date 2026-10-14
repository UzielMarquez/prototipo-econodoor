import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TipoServicioCatalogo, TipoServicioId } from '../../types';
import { Sliders, CheckCircle2, Clock, DollarSign, AlertCircle, ArrowRight, ShieldCheck, Check, Plus } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';

const serviceTypes: { id: TipoServicioId; nombre: string; descripcion: string }[] = [
  { id: 'instalacion', nombre: 'Instalación', descripcion: 'Instalación de un portón eléctrico.' },
  { id: 'preventivo', nombre: 'Mantenimiento preventivo', descripcion: 'Revisión y mantenimiento preventivo.' },
  { id: 'correctivo', nombre: 'Mantenimiento correctivo', descripcion: 'Diagnóstico y reparación de fallas.' },
];

export const CatalogAdminView: React.FC = () => {
  const { catalog, addCatalogItem, updateCatalogItem } = useAppStore();
  const [editingItem, setEditingItem] = useState<TipoServicioCatalogo | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTypeId, setNewTypeId] = useState<TipoServicioId | ''>('');
  const [newCatalogPrice, setNewCatalogPrice] = useState<number | ''>('');
  const [newCatalogDuration, setNewCatalogDuration] = useState<number | ''>('');
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Proposed values
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newDuration, setNewDuration] = useState<number>(0);

  // A3.3: Resumen comparativo modal
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleStartEdit = (item: TipoServicioCatalogo) => {
    setEditingItem(item);
    setNewPrice(item.precioBase);
    setNewDuration(item.duracionMinutos);
    setShowComparisonModal(false);
  };

  const handleOpenComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || newPrice <= 0 || newDuration <= 0) return;
    setShowComparisonModal(true); // A3.3: Solicitud de confirmación explícita con comparativa
  };

  const handleConfirmSave = () => {
    if (!editingItem) return;

    updateCatalogItem(editingItem.id, newPrice, newDuration);
    setShowComparisonModal(false);
    setEditingItem(null);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const availableTypes = serviceTypes.filter(type =>
    !catalog.some(item => item.id === type.id),
  );

  const handleAddCatalogItem = (event: React.FormEvent) => {
    event.preventDefault();
    const type = serviceTypes.find(item => item.id === newTypeId);
    if (!type || newCatalogPrice === '' || newCatalogDuration === '') return;
    if (newCatalogPrice <= 0 || newCatalogDuration <= 0) {
      setCatalogError('Ambos deben ser mayores a 0.');
      return;
    }

    const added = addCatalogItem({
      ...type,
      precioBase: newCatalogPrice,
      duracionMinutos: newCatalogDuration,
    });
    if (!added) {
      setCatalogError('Servicio ya configurado.');
      return;
    }

    setIsAddModalOpen(false);
    setNewTypeId('');
    setNewCatalogPrice('');
    setNewCatalogDuration('');
    setCatalogError(null);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-400" />
            Tarifas y duración
          </h2>
          <p className="text-sm text-slate-400">
            Define los precios y la duración estimada de cada tipo de servicio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {saveSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in" role="status">
              <CheckCircle2 className="w-4 h-4" />
              <span>Los cambios se guardaron correctamente.</span>
            </div>
          )}
          {availableTypes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNewTypeId('');
                setNewCatalogPrice('');
                setNewCatalogDuration('');
                setCatalogError(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Agregar tipo de servicio
            </button>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {catalog.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <Sliders aria-hidden="true" className="mx-auto h-7 w-7 text-sky-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">El catálogo está vacío</h3>
            <p className="mt-1 text-sm text-slate-400">
              Agrega los tipos que ofrece el negocio y define sus tarifas y duración.
            </p>
            {availableTypes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Configurar el primer servicio
              </button>
            )}
          </div>
        )}
        {catalog.map((item) => {
          return (
            <GlowCard key={item.id} className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 mt-1.5">{item.nombre}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.descripcion}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Precio base:
                    </span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      ${item.precioBase.toLocaleString()} MXN
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-4 h-4 text-sky-400" /> Duración estimada:
                    </span>
                    <strong className="text-slate-100 font-mono">
                      {item.duracionMinutos} min ({item.duracionMinutos / 60} h)
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  No cambia el precio de servicios ya registrados
                </span>
                <button
                  onClick={() => handleStartEdit(item)}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
                >
                  Modificar Parámetros
                </button>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100">Configurar tipo de servicio</h3>
            <p className="mt-1 text-xs text-slate-400">
              Define el precio de referencia y el tiempo estimado.
            </p>
            <form onSubmit={handleAddCatalogItem} className="mt-5 space-y-4">
              <div>
                <label htmlFor="new-service-type" className="mb-1 block text-xs font-semibold text-slate-300">Tipo de servicio *</label>
                <select
                  id="new-service-type"
                  required
                  value={newTypeId}
                  onChange={event => setNewTypeId(event.target.value as TipoServicioId | '')}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm text-slate-100"
                >
                  <option value="">Selecciona un tipo</option>
                  {availableTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="new-service-price" className="mb-1 block text-xs font-semibold text-slate-300">Precio base (MXN) *</label>
                <input
                  id="new-service-price"
                  type="number"
                  required
                  min={1}
                  value={newCatalogPrice}
                  onChange={event => setNewCatalogPrice(event.target.value === '' ? '' : Number(event.target.value))}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="new-service-duration" className="mb-1 block text-xs font-semibold text-slate-300">Duración estimada (minutos) *</label>
                <input
                  id="new-service-duration"
                  type="number"
                  required
                  min={1}
                  value={newCatalogDuration}
                  onChange={event => setNewCatalogDuration(event.target.value === '' ? '' : Number(event.target.value))}
                  className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm text-slate-100"
                />
              </div>
              {catalogError && <p className="text-xs text-rose-500" role="alert">{catalogError}</p>}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCatalogError(null);
                  }}
                  className="min-h-11 rounded-xl bg-slate-800 px-4 text-sm text-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="min-h-11 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white hover:bg-sky-400">
                  Guardar tipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edición de Catálogo */}
      {editingItem && !showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Editar Parámetros: {editingItem.nombre}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Revisa la comparación de precios y duración antes de guardar.
            </p>

            <form onSubmit={handleOpenComparison} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Precio Base ($ MXN) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Duración Estimada Predeterminada (Minutos &gt; 0) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                >
                  Revisar cambios <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showComparisonModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Confirmar cambios
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Revisa detalladamente la variación entre los valores actuales y la nueva propuesta para <strong className="text-slate-100">{editingItem.nombre}</strong>:
            </p>

            {/* Comparison Table */}
            <div className="rounded-xl overflow-hidden border border-slate-800 mb-5 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Parámetro</th>
                    <th className="p-3 text-slate-400">Valor Actual</th>
                    <th className="p-3 text-sky-400">Nuevo Valor</th>
                    <th className="p-3 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                  <tr>
                    <td className="p-3 font-sans font-semibold text-slate-100">Precio Base</td>
                    <td className="p-3 text-slate-400">${editingItem.precioBase.toLocaleString()} MXN</td>
                    <td className="p-3 text-emerald-400 font-bold">${newPrice.toLocaleString()} MXN</td>
                    <td className="p-3 text-right font-bold text-xs">
                      {newPrice - editingItem.precioBase >= 0 ? '+' : ''}${ (newPrice - editingItem.precioBase).toLocaleString() } MXN
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-semibold text-slate-100">Duración Estimada</td>
                    <td className="p-3 text-slate-400">{editingItem.duracionMinutos} min</td>
                    <td className="p-3 text-sky-300 font-bold">{newDuration} min</td>
                    <td className="p-3 text-right font-bold text-xs">
                      {newDuration - editingItem.duracionMinutos >= 0 ? '+' : ''}{newDuration - editingItem.duracionMinutos} min
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 mb-5">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Aplicación de cambios:
              </div>
              <p>
                Los cambios se aplicarán exclusivamente a futuras solicitudes de servicio. Ningún servicio registrado con anterioridad verá alterado su precio pactado.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Volver a corregir
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirmar y Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
