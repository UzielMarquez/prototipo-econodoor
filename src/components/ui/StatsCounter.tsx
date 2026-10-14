import React, { useEffect, useState } from 'react';

interface StatsCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  label: string;
  icon?: React.ReactNode;
  trend?: string;
}

export const StatsCounter: React.FC<StatsCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  label,
  icon,
  trend,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    const totalSteps = 30;
    const increment = (end - start) / totalSteps;
    const stepTime = duration / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-extrabold tracking-tight text-slate-100 font-mono">
          {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span className="inline-flex items-center font-medium text-slate-400">
            • {trend}
          </span>
        </div>
      )}
    </div>
  );
};
