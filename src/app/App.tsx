import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  History,
  LayoutDashboard,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { RoleSwitcher } from '../components/layout/RoleSwitcher';
import { LoginView } from '../components/auth/LoginView';
import { SearchModal } from '../components/ui/SearchModal';
import { useAppStore } from '../store/useAppStore';
import type { UserRole } from '../types';

const AuditLogView = lazy(() => import('../components/admin/AuditLogView').then(module => ({ default: module.AuditLogView })));
const CatalogAdminView = lazy(() => import('../components/admin/CatalogAdminView').then(module => ({ default: module.CatalogAdminView })));
const ReportsView = lazy(() => import('../components/admin/ReportsView').then(module => ({ default: module.ReportsView })));
const TechniciansAdminView = lazy(() => import('../components/admin/TechniciansAdminView').then(module => ({ default: module.TechniciansAdminView })));
const CalendarView = lazy(() => import('../components/staff/CalendarView').then(module => ({ default: module.CalendarView })));
const ClientsView = lazy(() => import('../components/staff/ClientsView').then(module => ({ default: module.ClientsView })));
const DashboardView = lazy(() => import('../components/staff/DashboardView').then(module => ({ default: module.DashboardView })));
const GatesView = lazy(() => import('../components/staff/GatesView').then(module => ({ default: module.GatesView })));
const ServicesBoard = lazy(() => import('../components/staff/ServicesBoard').then(module => ({ default: module.ServicesBoard })));
const TechnicianView = lazy(() => import('../components/technician/TechnicianView').then(module => ({ default: module.TechnicianView })));

const homeForRole = (role: UserRole) =>
  role === 'technician' ? '/technician' : '/dashboard';

function RequireSession() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const location = useLocation();

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
}

function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const role = useAppStore(state => state.currentUser.role);
  return allowedRoles.includes(role)
    ? children
    : <Navigate to={homeForRole(role)} replace />;
}

function HomeRedirect() {
  const role = useAppStore(state => state.currentUser.role);
  return <Navigate to={homeForRole(role)} replace />;
}

function DashboardPage() {
  const navigate = useNavigate();
  const destinations: Record<string, string> = {
    clients: '/clients',
    gates: '/gates',
    services: '/services',
    calendar: '/calendar',
  };
  return <DashboardView onNavigate={tab => navigate(destinations[tab] || '/dashboard')} />;
}

function AuthenticatedApp() {
  const { currentUser } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isTechnician = currentUser.role === 'technician';

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !isTechnician && !isSearchOpen) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isSearchOpen, isTechnician]);

  useEffect(() => {
    if (isTechnician) setIsSearchOpen(false);
  }, [isTechnician]);

  const navigationGroups = isTechnician
    ? [{
        label: 'Trabajo',
        links: [{ to: '/technician', label: 'Mis trabajos', icon: Wrench }],
      }]
    : [
        {
          label: 'General',
          links: [{ to: '/dashboard', label: 'Inicio', icon: LayoutDashboard }],
        },
        {
          label: 'Operación',
          links: [
            { to: '/clients', label: 'Clientes', icon: Users },
            { to: '/gates', label: 'Portones', icon: Shield },
            { to: '/services', label: 'Servicios', icon: Wrench },
            { to: '/calendar', label: 'Agenda', icon: CalendarDays },
            { to: '/reports', label: 'Informes', icon: BarChart3 },
          ],
        },
        ...(currentUser.role === 'admin'
          ? [{
              label: 'Administración',
              links: [
                { to: '/admin/technicians', label: 'Técnicos', icon: Users },
                { to: '/admin/catalog', label: 'Catálogo', icon: SlidersHorizontal },
                { to: '/admin/audit', label: 'Bitácora', icon: History },
              ],
            }]
          : []),
      ];
  const navigationLinks = navigationGroups.flatMap(group => group.links);
  const activeNavigationLink = navigationLinks.find(link => link.to === location.pathname) ?? navigationLinks[0];
  const ActiveSectionIcon = activeNavigationLink.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100">
      <RoleSwitcher />
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 pb-6 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 py-6 lg:block">
          <nav aria-label="Navegación principal" className="sticky top-24 space-y-6">
            {navigationGroups.map(group => (
              <div key={group.label}>
                <h2 className="mb-3 rounded-r-lg border-l-4 border-[#1F4E6B] bg-white px-3 py-2 text-sm font-semibold text-[#1D2935] shadow-sm">
                  {group.label}
                </h2>
                <div className="space-y-1">
                  {group.links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      className={({ isActive }) =>
                        `group flex min-h-11 items-center gap-2.5 rounded-r-lg border-l-[3px] px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'border-white/80 bg-[#1F4E6B] font-semibold text-white shadow-sm ring-1 ring-[#193F57]/15'
                            : 'border-transparent font-medium text-slate-300 hover:bg-white hover:text-slate-100'
                        }`
                      }
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                        location.pathname === to ? 'bg-white/15 text-white' : 'text-current'
                      }`}>
                        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                      </span>
                      <span className="flex-1">{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 border-b border-slate-700 py-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#1F4E6B]/20 bg-white p-2.5 shadow-sm lg:hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F4E6B] text-white">
                <ActiveSectionIcon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sección actual</span>
                <span className="block truncate text-sm font-semibold text-slate-100">{activeNavigationLink.label}</span>
              </span>
              <span className="relative shrink-0">
                <select
                  value={location.pathname}
                  onChange={event => navigate(event.target.value)}
                  aria-label={`Cambiar sección. Sección actual: ${activeNavigationLink.label}`}
                  className="min-h-10 max-w-[46vw] appearance-none rounded-lg border border-[#1F4E6B]/25 bg-[#F7F9FA] py-2 pl-2 pr-8 text-xs font-semibold text-[#1D2935] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E6B] sm:max-w-48 sm:pl-3 sm:text-sm"
                >
                  {navigationGroups.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.links.map(link => (
                        <option key={link.to} value={link.to}>{link.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F4E6B]" />
              </span>
            </label>

            {!isTechnician && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-white px-3.5 text-sm text-slate-300 transition-colors hover:border-sky-500 sm:max-w-sm"
                aria-label="Abrir búsqueda rápida"
              >
                <span className="flex items-center gap-2">
                  <Search aria-hidden="true" className="h-4 w-4 text-sky-500" />
                  Buscar clientes o servicios
                </span>
              </button>
            )}
          </div>

          <main key={location.pathname} className="animate-fade-in py-6 sm:py-8">
            <Suspense
              fallback={
                <p className="py-12 text-center text-sm text-slate-300" role="status">
                  Cargando vista…
                </p>
              }
            >
              <Outlet />
            </Suspense>
          </main>

          <footer className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">
            Econodoor · Instalación y mantenimiento de portones
          </footer>
        </div>
      </div>

      {!isTechnician && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectClient={clientId => {
            const client = useAppStore.getState().clients.find(item => item.id === clientId);
            navigate('/clients', { state: { search: client?.nombreOrazonSocial || '' } });
          }}
          onSelectService={serviceId => {
            const service = useAppStore.getState().services.find(item => item.id === serviceId);
            navigate('/services', { state: { search: service?.codigoFolio || '' } });
          }}
        />
      )}
    </div>
  );
}

export const App: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const role = useAppStore(state => state.currentUser.role);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <HomeRedirect /> : <LoginView />}
      />
      <Route element={<RequireSession />}>
        <Route element={<AuthenticatedApp />}>
          <Route index element={<HomeRedirect />} />
          <Route
            path="dashboard"
            element={
              <RequireRole allowedRoles={['admin', 'staff']}>
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route path="services" element={<RequireRole allowedRoles={['admin', 'staff']}><ServicesBoard /></RequireRole>} />
          <Route path="calendar" element={<RequireRole allowedRoles={['admin', 'staff']}><CalendarView /></RequireRole>} />
          <Route path="clients" element={<RequireRole allowedRoles={['admin', 'staff']}><ClientsView /></RequireRole>} />
          <Route path="gates" element={<RequireRole allowedRoles={['admin', 'staff']}><GatesView /></RequireRole>} />
          <Route path="reports" element={<RequireRole allowedRoles={['admin', 'staff']}><ReportsView /></RequireRole>} />
          <Route path="admin/technicians" element={<RequireRole allowedRoles={['admin']}><TechniciansAdminView /></RequireRole>} />
          <Route path="admin/catalog" element={<RequireRole allowedRoles={['admin']}><CatalogAdminView /></RequireRole>} />
          <Route path="admin/audit" element={<RequireRole allowedRoles={['admin']}><AuditLogView /></RequireRole>} />
          <Route path="technician" element={<RequireRole allowedRoles={['technician']}><TechnicianView /></RequireRole>} />
          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? homeForRole(role) : '/login'} replace />} />
    </Routes>
  );
};
