import React from 'react';
import { Briefcase, LogOut, Shield, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../types';

const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: 'staff', label: 'Recepcionista', icon: <Briefcase aria-hidden="true" className="h-4 w-4" /> },
  { role: 'technician', label: 'Técnico', icon: <Wrench aria-hidden="true" className="h-4 w-4" /> },
  { role: 'admin', label: 'Administrador', icon: <Shield aria-hidden="true" className="h-4 w-4" /> },
];

const roleHome = (role: UserRole) => role === 'technician' ? '/technician' : '/dashboard';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, signOut } = useAppStore();
  const navigate = useNavigate();
  const activeRole = roles.find(role => role.role === currentUser.role);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D5DEE5] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
        <Link to={roleHome(currentUser.role)} className="inline-flex min-h-11 items-center gap-3 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E6B]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F4E6B] text-[#FFFFFF]">
            <Wrench aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-5 tracking-tight text-[#1D2935]">Econodoor</span>
            <span className="block text-xs text-[#586B79]">Operación de servicios</span>
          </span>
        </Link>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          <div
            aria-label={`Rol de esta sesión: ${activeRole?.label}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#D5DEE5] bg-[#F7F9FA] px-3 text-xs font-medium text-[#1D2935]"
          >
            <span className="text-[#1F4E6B]">{activeRole?.icon}</span>
            <span>{activeRole?.label}</span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-[#536574] transition-colors hover:bg-[#F2F5F7] hover:text-[#1D2935] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E6B] sm:px-3"
            aria-label="Cerrar sesión"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
