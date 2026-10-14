import type { TipoServicioId, TipoCliente } from '../types';

export const serviceTypeLabels: Record<TipoServicioId, string> = {
  instalacion: 'Instalación',
  preventivo: 'Mantenimiento preventivo',
  correctivo: 'Mantenimiento correctivo',
};

export const clientTypeLabels: Record<TipoCliente, string> = {
  persona: 'Persona física',
  empresa: 'Empresa',
};
