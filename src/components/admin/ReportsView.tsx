import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BarChart3, FileDown, Calendar, DollarSign, Wrench, CheckCircle2, Clock, Users, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import { StatsCounter } from '../ui/StatsCounter';
import { GlowCard } from '../ui/GlowCard';
import { serviceTypeLabels } from '../../utils/labels';

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const ReportsView: React.FC = () => {
  const { services, payments, technicians, appointments, clients, getServicePaymentState } = useAppStore();

  // A5.2: Período configurable mediante selector de fechas
  const [startDate, setStartDate] = useState(() => `${getLocalDate().slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(getLocalDate);

  // Excel columns checkbox state (A5.5: eligiendo las columnas a incluir mediante casillas de verificación)
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [cols, setCols] = useState({
    folio: true,
    cliente: true,
    tipo: true,
    costo: true,
    estado: true,
    estadoPago: true,
    fecha: true,
  });

  const validPeriod = startDate <= endDate;
  const periodServices = validPeriod
    ? services.filter(s => s.fechaSolicitud >= startDate && s.fechaSolicitud <= endDate)
    : [];
  const periodPayments = validPeriod
    ? payments.filter(p => !p.anulado && p.fecha >= startDate && p.fecha <= endDate)
    : [];

  // Indicators (A5.1)
  const totalIngresos = periodPayments.reduce((acc, curr) => acc + curr.importe, 0);
  const totalServicios = periodServices.length;
  const terminadosCount = periodServices.filter(s => s.estado === 'terminado').length;
  const pendientesCount = periodServices.filter(s => s.estado !== 'terminado' && s.estado !== 'cancelado').length;

  // Breakdown by type (A5.1, A5.3)
  const byType = {
    instalacion: periodServices.filter(s => s.tipoServicioId === 'instalacion').length,
    preventivo: periodServices.filter(s => s.tipoServicioId === 'preventivo').length,
    correctivo: periodServices.filter(s => s.tipoServicioId === 'correctivo').length,
  };

  // Services with pending payment (A5.1, A5.3: solo tabla)
  const pendingPaymentServices = periodServices.filter(s => {
    const p = getServicePaymentState(s.id);
    return p.saldoPendiente > 0 && s.estado !== 'cancelado';
  });

  // Export to PDF (A5.4)
  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Econodoor — Reporte Ejecutivo de Servicios', 14, 22);
    doc.setFontSize(10);
    doc.text(`Período de análisis: ${startDate} al ${endDate}`, 14, 30);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, 14, 36);

    doc.setFontSize(12);
    doc.text('1. Indicadores Principales', 14, 46);
    doc.setFontSize(10);
    doc.text(`• Total de servicios en período: ${totalServicios}`, 14, 54);
    doc.text(`• Servicios terminados: ${terminadosCount}`, 14, 60);
    doc.text(`• Servicios pendientes en curso: ${pendientesCount}`, 14, 66);
    doc.text(`• Ingresos totales registrados: $${totalIngresos.toLocaleString()} MXN`, 14, 72);

    doc.setFontSize(12);
    doc.text('2. Servicios por Tipo', 14, 84);
    doc.setFontSize(10);
    doc.text(`• Instalación Completa: ${byType.instalacion}`, 14, 92);
    doc.text(`• Mantenimiento Preventivo: ${byType.preventivo}`, 14, 98);
    doc.text(`• Mantenimiento Correctivo: ${byType.correctivo}`, 14, 104);

    doc.setFontSize(12);
    doc.text('3. Servicios con Cobro Pendiente', 14, 116);
    let yPos = 124;
    pendingPaymentServices.slice(0, 8).forEach(s => {
      const client = clients.find(c => c.id === s.clienteId);
      const payment = getServicePaymentState(s.id);
      doc.setFontSize(9);
      doc.text(`${s.codigoFolio} - ${client?.nombreOrazonSocial || 'Cliente'}: Saldo $${payment.saldoPendiente.toLocaleString()} MXN (Costo: $${s.costo})`, 14, yPos);
      yPos += 6;
    });

    doc.save(`Econodoor_Reporte_${startDate}_${endDate}.pdf`);
  };

  // Export to Excel with column selection (A5.5)
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = periodServices.map(s => {
      const client = clients.find(c => c.id === s.clienteId);
      const payment = getServicePaymentState(s.id);
      const row: Record<string, string | number> = {};

      if (cols.folio) row['Folio'] = s.codigoFolio;
      if (cols.cliente) row['Cliente'] = client?.nombreOrazonSocial || 'N/A';
      if (cols.tipo) row['Tipo de Servicio'] = serviceTypeLabels[s.tipoServicioId];
      if (cols.costo) row['Costo ($ MXN)'] = s.costo;
      if (cols.estado) row['Estado Servicio'] = s.estado;
      if (cols.estadoPago) row['Estado Pago'] = payment.estado;
      if (cols.fecha) row['Fecha Solicitud'] = s.fechaSolicitud;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios');
    XLSX.writeFile(workbook, `Econodoor_Servicios_${startDate}.xlsx`);
    setIsExcelModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with PDF & Excel actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            Informes del negocio
          </h2>
          <p className="text-sm text-slate-400">
            Revisa los servicios, pagos y carga de trabajo del período seleccionado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={!validPeriod || (periodServices.length === 0 && periodPayments.length === 0)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Exportar informe en PDF"
          >
            <FileDown className="w-4 h-4 text-sky-400" /> Exportar PDF
          </button>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            disabled={!validPeriod || periodServices.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            title="Exportar servicios a Excel"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Período del informe</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs"
            />
          </div>
        </div>
      </div>
      {!validPeriod && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700" role="alert">
          Rango de fechas inválido.
        </p>
      )}
      {validPeriod && periodServices.length === 0 && periodPayments.length === 0 && (
        <p className="rounded-lg border border-slate-700 bg-white p-4 text-sm text-slate-300" role="status">
          No hay actividad registrada en este período. Los informes aparecerán cuando se registren servicios o pagos.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCounter
          label="Total Servicios"
          value={totalServicios}
          icon={<Wrench className="w-4 h-4" />}
          trend="Registrados en el período"
        />
        <StatsCounter
          label="Servicios Concluidos"
          value={terminadosCount}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          trend="Trabajos cerrados"
        />
        <StatsCounter
          label="Servicios Pendientes"
          value={pendientesCount}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          trend="En proceso o programados"
        />
        <StatsCounter
          label="Ingresos Cobrados"
          value={totalIngresos}
          prefix="$"
          suffix=" MXN"
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          trend="Pagos vigentes registrados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico 1: Servicios por Tipo */}
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" /> Servicios por tipo
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total: {totalServicios}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Instalaciones', count: byType.instalacion, color: 'bg-sky-500' },
              { label: 'Preventivos', count: byType.preventivo, color: 'bg-emerald-500' },
              { label: 'Correctivos', count: byType.correctivo, color: 'bg-amber-500' },
            ].map(item => {
              const pct = totalServicios > 0 ? Math.round((item.count / totalServicios) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Gráfico 2: Desempeño por Técnico */}
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" /> Servicios por técnico
            </h3>
            <span className="text-xs text-slate-400 font-mono">Técnicos Activos</span>
          </div>

          <div className="space-y-3">
            {technicians.length === 0 && (
              <p className="text-sm text-slate-400">No hay técnicos registrados para comparar.</p>
            )}
            {technicians.map(t => {
              const techCitas = appointments.filter(a => a.tecnicoId === t.id);
              const maxCitas = Math.max(1, ...technicians.map(x => appointments.filter(a => a.tecnicoId === x.id).length));
              const pct = Math.round((techCitas.length / maxCitas) * 100);

              return (
                <div key={t.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{t.nombreCompleto} {!t.activo && '(Inactivo)'}</span>
                    <span className="font-mono text-sky-400 font-bold">{techCitas.length} citas</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Servicios con saldo pendiente
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Servicios del período que aún tienen un saldo por cobrar.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            {pendingPaymentServices.length} órdenes por liquidar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Folio</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Servicio</th>
                <th className="p-3.5">Estado Trabajo</th>
                <th className="p-3.5">Costo Acordado</th>
                <th className="p-3.5">Pagado Vigente</th>
                <th className="p-3.5 text-right">Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pendingPaymentServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                    No hay servicios con saldo pendiente en este período.
                  </td>
                </tr>
              ) : (
                pendingPaymentServices.map(srv => {
                  const client = clients.find(c => c.id === srv.clienteId);
                  const p = getServicePaymentState(srv.id);

                  return (
                    <tr key={srv.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-sky-400">{srv.codigoFolio}</td>
                      <td className="p-3.5 font-sans font-semibold text-slate-100">{client?.nombreOrazonSocial}</td>
                      <td className="p-3.5 font-sans text-slate-300">{serviceTypeLabels[srv.tipoServicioId]}</td>
                      <td className="p-3.5 font-sans capitalize text-slate-400">{srv.estado}</td>
                      <td className="p-3.5 text-slate-300">${srv.costo.toLocaleString()}</td>
                      <td className="p-3.5 text-emerald-400">${p.totalPagado.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-bold text-amber-400">${p.saldoPendiente.toLocaleString()} MXN</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D2935]/55 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Exportar a Excel
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Selecciona las columnas que deseas incluir en la hoja de cálculo generada:
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                { id: 'folio', label: 'Folio de la Orden de Servicio' },
                { id: 'cliente', label: 'Nombre o Razón Social del Cliente' },
                { id: 'tipo', label: 'Tipo de Servicio' },
                { id: 'costo', label: 'Costo Pactado ($ MXN)' },
                { id: 'estado', label: 'Estado del Servicio' },
                { id: 'estadoPago', label: 'Estado de Pago' },
                { id: 'fecha', label: 'Fecha de Solicitud' },
              ].map(c => (
                <label key={c.id} className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cols[c.id as keyof typeof cols]}
                    onChange={(e) => setCols({ ...cols, [c.id]: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-500 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                Descargar Hoja Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
