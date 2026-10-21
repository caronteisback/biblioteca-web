import { estadoDelPrestamo } from '../formato.ts'

/** "Activo", "Vencido (N días)" or "Devuelto", colored by meaning. */
export function EtiquetaDePrestamo({ prestamo }: { prestamo: { activo: boolean; diasRetraso: number } }) {
  const estado = estadoDelPrestamo(prestamo)
  return (
    <span className={`etiqueta etiqueta-${estado.toLowerCase()}`}>
      {estado === 'Vencido' ? `Vencido (${prestamo.diasRetraso} d)` : estado}
    </span>
  )
}
