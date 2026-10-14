import React from 'react';
import { ArrowRight, BriefcaseBusiness, Shield, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../types';

const demoRoles: {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    role: 'admin',
    label: 'Administrador',
    description: 'Personal, tarifas y seguimiento de la operación',
    icon: <Shield aria-hidden="true" className="h-5 w-5" />,
  },
  {
    role: 'staff',
    label: 'Recepcionista',
    description: 'Registro de clientes, servicios y agenda',
    icon: <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />,
  },
  {
    role: 'technician',
    label: 'Técnico',
    description: 'Trabajos asignados e historial de portones',
    icon: <Wrench aria-hidden="true" className="h-5 w-5" />,
  },
];

const homeForRole = (role: UserRole) =>
  role === 'technician' ? '/technician' : '/dashboard';

export const LoginView: React.FC = () => {
  const enterDemo = useAppStore(state => state.enterDemo);
  const navigate = useNavigate();

  const enterAs = (role: UserRole) => {
    enterDemo(role);
    navigate(homeForRole(role), { replace: true });
  };

  return (
    <main className="min-h-dvh bg-[#F2F5F7] px-4 py-4 text-[#1D2935] sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-6xl items-center sm:min-h-[calc(100dvh-3rem)]">
        <div className="grid w-full overflow-hidden rounded-2xl border border-[#D5DEE5] bg-white shadow-[0_18px_55px_rgba(29,41,53,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-[#1F4E6B] p-8 text-[#FFFFFF] lg:flex xl:p-12">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]">
              <div className="absolute -right-28 -top-24 h-[28rem] w-[28rem] rounded-full border border-white/60" />
              <div className="absolute -right-16 -top-12 h-[24rem] w-[24rem] rounded-full border border-white/50" />
              <div className="absolute -right-4 top-0 h-[20rem] w-[20rem] rounded-full border border-white/40" />
            </div>
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                <Wrench aria-hidden="true" className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Econodoor</span>
            </div>
            <div className="relative max-w-lg">
              <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] xl:text-5xl">
                Instalación y mantenimiento, en orden.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-[#DCEAF1]">
                Organiza clientes, portones, servicios y visitas desde un mismo lugar.
              </p>
            </div>
          </section>

          <section className="flex items-center justify-center px-5 py-6 sm:px-10 sm:py-8 lg:px-10 xl:px-12">
            <div className="w-full max-w-md">
              <div className="mb-5 lg:hidden">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F4E6B] text-[#FFFFFF]">
                  <Wrench aria-hidden="true" className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-[#1F4E6B]">Econodoor</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bienvenido a Econodoor</h2>
                <p className="mt-2 text-sm leading-6 text-[#536574]">
                  Selecciona el área desde la que quieres empezar.
                </p>
              </div>

              <div className="mt-5 space-y-2.5" aria-label="Seleccionar área de trabajo">
                {demoRoles.map(({ role, label, description, icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => enterAs(role)}
                    className="group flex min-h-[68px] w-full items-center gap-3 rounded-xl border border-[#D5DEE5] bg-white p-3 text-left transition-colors hover:border-[#1F4E6B] hover:bg-[#F7F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E6B] focus-visible:ring-offset-2"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EFF3] text-[#1F4E6B]">
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#1D2935]">{label}</span>
                      <span className="mt-0.5 block text-xs leading-4 text-[#536574]">{description}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#667A89] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>

              <p className="mt-4 rounded-lg border border-[#D5DEE5] bg-[#F7F9FA] px-3 py-2.5 text-xs leading-5 text-[#536574]">
                Los cambios de esta sesión no se guardan al salir o recargar la página.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
