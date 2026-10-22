import { estadoDelPrestamo } from '../formato.ts'
import { Estado, type Tono } from './Estado.tsx'

const TONO: Record<string, Tono> = { Activo: 'ok', 'Vence pronto': 'aviso', Vencido: 'error', Devuelto: 'neutro' }

/** "Activo", "Vence pronto", "Vencido (N días)" or "Devuelto", colored by meaning. */
export function EtiquetaDePrestamo({ prestamo }: { prestamo: { activo: boolean; diasRetraso: number; alertas?: { code: string }[] } }) {
  const estado = estadoDelPrestamo(prestamo)
  return <Estado tono={TONO[estado]}>{estado === 'Vencido' ? `Vencido (${prestamo.diasRetraso} d)` : estado}</Estado>
}
