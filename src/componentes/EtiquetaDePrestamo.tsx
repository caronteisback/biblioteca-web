import { estadoDelPrestamo } from '../formato.ts'
import { Estado, type Tono } from './Estado.tsx'

const TONO: Record<string, Tono> = { Activo: 'ok', Vencido: 'error', Devuelto: 'neutro' }

/** "Activo", "Vencido (N días)" or "Devuelto", colored by meaning. */
export function EtiquetaDePrestamo({ prestamo }: { prestamo: { activo: boolean; diasRetraso: number } }) {
  const estado = estadoDelPrestamo(prestamo)
  return <Estado tono={TONO[estado]}>{estado === 'Vencido' ? `Vencido (${prestamo.diasRetraso} d)` : estado}</Estado>
}
