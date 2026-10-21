import type { Ejemplar } from './api/cliente.ts'

/** "2026-10-19" as "19/10/2026". Anything else is returned as it came. */
export function formatearDia(iso: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : iso
}

/** A copy is "De baja" when retired, "Prestado" when active but on loan, "Disponible" otherwise. */
export function estadoDelEjemplar(ejemplar: Pick<Ejemplar, 'activo' | 'disponible'>): string {
  if (!ejemplar.activo) return 'De baja'
  return ejemplar.disponible ? 'Disponible' : 'Prestado'
}
