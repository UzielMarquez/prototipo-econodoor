import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Cliente, TipoCliente } from '../../types';
import { UserPlus, Search, Phone, MapPin, Building, User, AlertCircle, CheckCircle2, RotateCcw, Trash2, Edit2, Plus } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';
import { useLocation } from 'react-router';

export const ClientsView: React.FC = () => {
  const { clients, addClient, updateClient, addAddressToClient, deactivateClient, reactivateClient, checkPhoneExists, services } = useAppStore();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  // Form states
  const [tipo, setTipo] = useState<TipoCliente>('persona');
  const [nombrePersona, setNombrePersona] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direcciones, setDirecciones] = useState<{ calleNumero: string; colonia: string; ciudad: string; referencias?: string }[]>([
    { calleNumero: '', colonia: '', ciudad: '', referencias: '' },
  ]);
  const [phoneInputError, setPhoneInputError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { search?: string } | null;
    if (state?.search) setSearchTerm(state.search);
  }, [location.key, location.state]);

  const resetForm = () => {
    setTipo('persona');
    setNombrePersona('');
    setRazonSocial('');
    setNombreContacto('');
    setTelefono('');
    setDirecciones([{ calleNumero: '', colonia: '', ciudad: '', referencias: '' }]);
    setPhoneInputError(null);
    setPhoneWarning(null);
    setEditingClient(null);
  };

  const handlePhoneChange = (val: string) => {
    const containsNonDigits = /[^0-9]/.test(val);
    const digitsOnly = val.replace(/[^0-9]/g, '');
    const exceedsMaximum = digitsOnly.length > 10;
    const normalizedPhone = digitsOnly.slice(0, 10);

    setTelefono(normalizedPhone);
    setPhoneInputError(
      containsNonDigits
        ? 'Solo números.'
        : exceedsMaximum
          ? 'Máximo 10 dígitos.'
          : normalizedPhone.length > 0 && normalizedPhone.length < 10
            ? 'Faltan dígitos.'
            : null,
    );

    if (normalizedPhone.length === 10) {
      const exists = checkPhoneExists(normalizedPhone, editingClient?.id);
      if (exists) {
        setPhoneWarning('Teléfono duplicado.');
      } else {
        setPhoneWarning(null);
      }
    } else {
      setPhoneWarning(null);
    }
  };

  const addAddressField = () => {
    setDirecciones([...direcciones, { calleNumero: '', colonia: '', ciudad: '', referencias: '' }]);
  };

  const removeAddressField = (index: number) => {
    if (direcciones.length > 1) {
      setDirecciones(direcciones.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreOrazonSocial = tipo === 'persona' ? nombrePersona.trim() : razonSocial.trim();
    if (!nombreOrazonSocial || !/^[0-9]{10}$/.test(telefono)) {
      if (!/^[0-9]{10}$/.test(telefono)) {
        setPhoneInputError('Usa 10 dígitos.');
      }
      return;
    }
    if (checkPhoneExists(telefono, editingClient?.id)) {
      setPhoneWarning('Teléfono duplicado.');
      return;
    }

    const enteredAddresses = direcciones.filter(d =>
      d.calleNumero.trim() || d.colonia.trim() || d.ciudad.trim(),
    );
    const completeAddresses = enteredAddresses.filter(d =>
      d.calleNumero.trim() && d.colonia.trim() && d.ciudad.trim(),
    );
    if (
      enteredAddresses.length !== completeAddresses.length ||
      (!editingClient && completeAddresses.length === 0)
    ) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        tipo,
        nombreOrazonSocial,
        nombreContacto: tipo === 'empresa' ? nombreContacto : undefined,
        telefono,
      });
      completeAddresses.forEach(address => addAddressToClient(editingClient.id, {
        calleNumero: address.calleNumero.trim(),
        colonia: address.colonia.trim(),
        ciudad: address.ciudad.trim(),
        referencias: address.referencias?.trim(),
      }));
    } else {
      addClient({
        tipo,
        nombreOrazonSocial,
        nombreContacto: tipo === 'empresa' ? nombreContacto : undefined,
        telefono,
        activo: true,
        direcciones: completeAddresses.map(address => ({
          calleNumero: address.calleNumero.trim(),
          colonia: address.colonia.trim(),
          ciudad: address.ciudad.trim(),
          referencias: address.referencias?.trim(),
        })),
      });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (c: Cliente) => {
    setEditingClient(c);
    setTipo(c.tipo);
    setNombrePersona(c.tipo === 'persona' ? c.nombreOrazonSocial : '');
    setRazonSocial(c.tipo === 'empresa' ? c.nombreOrazonSocial : '');
    setNombreContacto(c.nombreContacto || '');
    setTelefono(c.telefono);
    setPhoneInputError(null);
    setPhoneWarning(null);
    setDirecciones([{ calleNumero: '', colonia: '', ciudad: '', referencias: '' }]);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.nombreOrazonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nombreContacto && c.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.telefono.includes(searchTerm) ||
      c.direcciones.some(d => d.calleNumero.toLowerCase().includes(searchTerm.toLowerCase()) || d.colonia.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterActive === 'active') return matchesSearch && c.activo;
    if (filterActive === 'inactive') return matchesSearch && !c.activo;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-sky-400" />
            Clientes
          </h2>
          <p className="text-sm text-slate-400">
            Consulta y administra los datos de contacto y domicilios de servicio.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Nuevo Cliente
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o domicilio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterActive === 'active' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Activos ({clients.filter(c => c.activo).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterActive === 'inactive' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Desactivados ({clients.filter(c => !c.activo).length})
          </button>
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterActive === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Todos ({clients.length})
          </button>
        </div>
      </div>

      {/* Clients cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <User className="mx-auto h-7 w-7 text-sky-400" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold text-slate-100">
              {clients.length === 0 ? 'Aún no hay clientes registrados' : 'No se encontraron clientes'}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {clients.length === 0
                ? 'Registra el primer cliente para empezar a organizar sus portones y servicios.'
                : 'Prueba con otro término de búsqueda o filtro.'}
            </p>
            {clients.length === 0 && (
              <button
                type="button"
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                Registrar cliente
              </button>
            )}
          </div>
        )}
        {filteredClients.map((client) => {
          const clientServices = services.filter(s => s.clienteId === client.id);
          return (
            <GlowCard key={client.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {client.tipo === 'persona' ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base leading-tight">
                        {client.nombreOrazonSocial}
                      </h3>
                      <span className="text-[11px] text-sky-400 uppercase font-semibold">
                        {client.tipo === 'persona' ? 'Persona Física' : `Empresa • Contacto: ${client.nombreContacto}`}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${client.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                    {client.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 my-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-mono">{client.telefono}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" /> Direcciones de Servicio ({client.direcciones.length}):
                    </div>
                    {client.direcciones.map(d => (
                      <div key={d.id} className="pl-5 text-slate-400 text-[11px] border-l-2 border-slate-800">
                        {d.calleNumero}, {d.colonia} {d.referencias && <span className="italic text-slate-500">({d.referencias})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-3">
                <span className="text-[11px] text-slate-500">
                  {clientServices.length} servicios registrados
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Editar datos del cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {client.activo ? (
                    <button
                      onClick={() => deactivateClient(client.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title={clientServices.length > 0 ? "Desactivar cliente con historial" : "Desactivar cliente"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivateClient(client.id)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                      title="Reactivar cliente"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Modal Alta/Edición Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2935]/55 p-2 backdrop-blur-sm animate-fade-in sm:p-4">
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-5">
            <h3 className="mb-1 flex shrink-0 items-center gap-2 text-xl font-bold text-slate-100">
              <UserPlus className="w-5 h-5 text-sky-400" />
              {editingClient ? 'Actualizar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
            <p className="mb-3 shrink-0 text-xs text-slate-400">
              Registra los datos de contacto y al menos un domicilio de servicio.
            </p>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {/* Selector Tipo Cliente */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  ¿A quién vas a registrar?
                </label>
                <div className="grid grid-cols-2 gap-2" aria-label="Tipo de cliente">
                  <button
                    type="button"
                    onClick={() => setTipo('persona')}
                    aria-pressed={tipo === 'persona'}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      tipo === 'persona'
                        ? 'border-[#1F4E6B] bg-[#E8EFF3] text-[#1D2935] shadow-sm'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipo === 'persona' ? 'bg-[#1F4E6B] text-white' : 'bg-slate-700/70'}`}>
                      <User className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">Persona física</span>
                      <span className={`mt-0.5 block text-[11px] ${tipo === 'persona' ? 'text-[#536574]' : 'opacity-75'}`}>Un particular</span>
                    </span>
                    <span aria-hidden="true" className={`h-4 w-4 rounded-full border-2 ${tipo === 'persona' ? 'border-[#1F4E6B] bg-[#1F4E6B] ring-2 ring-[#1F4E6B]/20' : 'border-slate-500'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('empresa')}
                    aria-pressed={tipo === 'empresa'}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      tipo === 'empresa'
                        ? 'border-[#1F4E6B] bg-[#E8EFF3] text-[#1D2935] shadow-sm'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipo === 'empresa' ? 'bg-[#1F4E6B] text-white' : 'bg-slate-700/70'}`}>
                      <Building className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">Empresa</span>
                      <span className={`mt-0.5 block text-[11px] ${tipo === 'empresa' ? 'text-[#536574]' : 'opacity-75'}`}>Un negocio</span>
                    </span>
                    <span aria-hidden="true" className={`h-4 w-4 rounded-full border-2 ${tipo === 'empresa' ? 'border-[#1F4E6B] bg-[#1F4E6B] ring-2 ring-[#1F4E6B]/20' : 'border-slate-500'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tipo === 'persona' ? (
                <div className="animate-fade-in">
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Nombre completo"
                    value={nombrePersona}
                    onChange={(e) => setNombrePersona(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                <div className="animate-fade-in">
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">
                    Razón social *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="organization"
                    placeholder="Nombre de la empresa"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">
                    Persona de contacto *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Nombre de contacto"
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                </>
              )}

              {/* Teléfono con validación en tiempo real */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-300">
                  Teléfono de Contacto *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  placeholder="10 dígitos"
                  value={telefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  aria-invalid={Boolean(phoneInputError || phoneWarning)}
                  aria-describedby={phoneInputError ? 'client-phone-error' : phoneWarning ? 'client-phone-warning' : undefined}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm text-slate-100 focus:outline-none ${phoneInputError ? 'border-rose-500 focus:border-rose-400' : phoneWarning ? 'border-amber-500 focus:border-amber-400' : 'border-slate-700 focus:border-sky-500'}`}
                />
                {phoneInputError && (
                  <div id="client-phone-error" className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{phoneInputError}</span>
                  </div>
                )}
                {phoneWarning && (
                  <div id="client-phone-warning" className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fade-in" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{phoneWarning}</span>
                  </div>
                )}
              </div>
              </div>

              <div className="space-y-2 pt-1">
                  {editingClient && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <p className="mb-1.5 text-xs font-semibold text-slate-300">Domicilios registrados</p>
                      {editingClient.direcciones.length === 0 ? (
                        <p className="text-xs text-slate-400">Aún no hay domicilios registrados.</p>
                      ) : (
                        <ul className="space-y-1 text-xs text-slate-400">
                          {editingClient.direcciones.map(address => (
                            <li key={address.id}>
                              {address.calleNumero}, {address.colonia}, {address.ciudad}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase">
                      {editingClient ? 'Agregar domicilio' : 'Domicilio de servicio'}
                    </label>
                    <button
                      type="button"
                      onClick={addAddressField}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar otro domicilio
                    </button>
                  </div>

                  {direcciones.map((dir, index) => (
                    <div key={index} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Dirección #{index + 1}</span>
                        {direcciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddressField(index)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        aria-label={`Domicilio ${index + 1}: calle y número`}
                        required={!editingClient || Boolean(dir.calleNumero || dir.colonia || dir.ciudad)}
                        placeholder="Calle y número"
                        value={dir.calleNumero}
                        onChange={(e) => {
                          const updated = [...direcciones];
                          updated[index].calleNumero = e.target.value;
                          setDirecciones(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                      />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          type="text"
                          aria-label={`Domicilio ${index + 1}: colonia`}
                          required={!editingClient || Boolean(dir.calleNumero || dir.colonia || dir.ciudad)}
                          placeholder="Colonia"
                          value={dir.colonia}
                          onChange={(e) => {
                            const updated = [...direcciones];
                            updated[index].colonia = e.target.value;
                            setDirecciones(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                        />
                        <input
                          type="text"
                          aria-label={`Domicilio ${index + 1}: ciudad`}
                          required={!editingClient || Boolean(dir.calleNumero || dir.colonia || dir.ciudad)}
                          placeholder="Ciudad"
                          value={dir.ciudad}
                          onChange={(e) => {
                            const updated = [...direcciones];
                            updated[index].ciudad = e.target.value;
                            setDirecciones(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                        />
                        <input
                          type="text"
                          aria-label={`Domicilio ${index + 1}: referencias`}
                          placeholder="Referencias o notas"
                          value={dir.referencias}
                          onChange={(e) => {
                            const updated = [...direcciones];
                            updated[index].referencias = e.target.value;
                            setDirecciones(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción modal */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
