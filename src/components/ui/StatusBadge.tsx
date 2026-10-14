import React from 'react';
import { EstadoServicio, EstadoPago } from '../../types';

interface StatusBadgeProps {
  type: 'servicio' | 'pago' | 'boolean' | 'cita';
  value: EstadoServicio | EstadoPago | boolean | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const sizeClasses = `${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm'} transition-all duration-300 ease-out`;

  if (type === 'servicio') {
    switch (value) {
      case 'solicitado':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Solicitado
          </span>
        );
      case 'programado':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Programado
          </span>
        );
      case 'en_proceso':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            En Proceso
          </span>
        );
      case 'terminado':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Terminado
          </span>
        );
      case 'cancelado':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Cancelado
          </span>
        );
      default:
        return null;
    }
  }

  if (type === 'pago') {
    switch (value) {
      case 'pendiente':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Pendiente
          </span>
        );
      case 'parcial':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Parcial
          </span>
        );
      case 'pagado':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Pagado
          </span>
        );
      default:
        return null;
    }
  }

  if (type === 'boolean') {
    return value ? (
      <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
        Activo
      </span>
    ) : (
      <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 ${sizeClasses}`}>
        Inactivo
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-slate-800 text-slate-300 ${sizeClasses}`}>
      {String(value)}
    </span>
  );
};
