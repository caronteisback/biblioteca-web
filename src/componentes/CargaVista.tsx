import type { ReactNode } from 'react'
import type { Carga } from '../hooks/useCargar.ts'
import { AvisoError } from './AvisoError.tsx'

/** Shows "loading", the error with a retry button, or the screen built from the data. */
export function CargaVista<T>({
  carga,
  reintentar,
  children,
}: {
  carga: Carga<T>
  reintentar: () => void
  children: (datos: T) => ReactNode
}) {
  if (carga.tipo === 'cargando') return <p aria-live="polite">Cargando…</p>
  if (carga.tipo === 'error') {
    return (
      <>
        <AvisoError error={carga.error} />
        <button type="button" onClick={reintentar}>
          Reintentar
        </button>
      </>
    )
  }
  return <>{children(carga.datos)}</>
}
