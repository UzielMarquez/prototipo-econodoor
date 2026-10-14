import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DollarSign, X, AlertCircle, Ban, Receipt, CheckCircle2, Plus } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

const getLocalDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

interface PaymentsModalProps {
  servicioId: string;
  onClose: () => void;
}

export const PaymentsModal: React.FC<PaymentsModalProps> = ({ servicioId, onClose }) => {
  const { services, payments, registerPayment, voidPayment, getServicePaymentState, currentUser } = useAppStore();
  const service = services.find(s => s.id === servicioId);
  const paymentState = getServicePaymentState(servicioId);

  // Form states
  const [importe, setImporte] = useState<number | ''>('');
  const [fecha, setFecha] = useState<string>(getLocalDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voiding state
  const [voidingPagoId, setVoidingPagoId] = useState<string | null>(null);
  const [voidMotivo, setVoidMotivo] = useState('');

  if (!service) return null;

  const servicePayments = payments.filter(p => p.servicioId === servicioId);

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (importe === '' || Number(importe) <= 0) {
      setErrorMsg('El importe debe ser mayor a cero.');
      return;
    }

    const result = registerPayment(servicioId, Number(importe), fecha);
    if (!result.success) {
      setErrorMsg(result.error || 'Error al procesar el pago.');
    } else {
      setImporte('');
      setErrorMsg(null);
    }
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingPagoId || !voidMotivo.trim()) return;

    voidPayment(voidingPagoId, voidMotivo);
    setVoidingPagoId(null);
    setVoidMotivo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Control de Pagos — <span className="font-mono text-sky-400">{service.codigoFolio}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Consulta los pagos y registra nuevos abonos de este servicio.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar pagos" className="min-h-11 min-w-11 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 my-5 p-4 rounded-xl bg-slate-950 border border-slate-800 sm:grid-cols-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Costo Total</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              ${paymentState.costoTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">MXN</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pagado</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              ${paymentState.totalPagado.toLocaleString()} <span className="text-xs font-normal text-slate-400">MXN</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Saldo pendiente</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              ${paymentState.saldoPendiente.toLocaleString()} <span className="text-xs font-normal text-slate-400">MXN</span>
            </div>
          </div>
        </div>

        {/* Register New Payment Form (P6.1, P6.3) */}
        {paymentState.saldoPendiente > 0 ? (
          <form onSubmit={handleRegisterPayment} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 mb-5">
            <span className="text-xs font-semibold text-sky-400 uppercase flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Registrar Nuevo Pago / Abono
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Importe Recibido ($ MXN) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentState.saldoPendiente}
                  placeholder={`Máximo $${paymentState.saldoPendiente}`}
                  value={importe}
                  onChange={(e) => setImporte(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Fecha de Cobro *
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                Registrar Pago
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Este servicio se encuentra completamente liquidado ($0 de saldo pendiente).</span>
          </div>
        )}

        {/* History of Payments (P6.5, P6.6) */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Historial de Movimientos ({servicePayments.length})
          </h4>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {servicePayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No se han registrado pagos para este servicio.</p>
            ) : (
              servicePayments.map((pago) => (
                <div
                  key={pago.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    pago.anulado
                      ? 'bg-rose-950/20 border-rose-500/30 text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`text-base font-bold ${pago.anulado ? 'line-through text-rose-400' : 'text-emerald-400'}`}>
                        ${pago.importe.toLocaleString()} MXN
                      </span>
                      {pago.anulado && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          ANULADO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Fecha: {pago.fecha} • Registrado por: {pago.usuarioRegistro}
                    </div>
                    {pago.anulado && pago.motivoAnulacion && (
                      <div className="mt-1 text-[11px] text-rose-300/80 italic">
                        Motivo de anulación: {pago.motivoAnulacion}
                      </div>
                    )}
                  </div>

                  {!pago.anulado && (
                    <button
                      onClick={() => {
                        setVoidingPagoId(pago.id);
                        setVoidMotivo('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-[11px] transition-colors"
                      title="Anular pago"
                    >
                      Anular
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal confirmación de anulación (P6.5, P6.6) */}
        {voidingPagoId && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-fade-in">
            <h5 className="text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-rose-400" /> Confirmar Anulación de Pago
            </h5>
            <p className="text-[11px] text-slate-300">
              El pago quedará anulado y el saldo se recalculará. Indica el motivo para continuar.
            </p>
            <form onSubmit={handleConfirmVoid} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Describe el motivo de la anulación..."
                value={voidMotivo}
                onChange={(e) => setVoidMotivo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidingPagoId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
