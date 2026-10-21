import { useCallback, useEffect, useState } from 'react'

export type Carga<T> = { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error'; error: unknown }

interface Guardado<T> {
  cargar: () => Promise<T>
  intento: number
  carga: Carga<T>
}

/**
 * Runs `cargar` when the component appears and again whenever the function changes, and keeps its state:
 * loading, ready with the data, or failed with the error. The second value asks for the same load again.
 *
 * `cargar` must be stable between renders (wrap it in `useCallback` with what it depends on): a new function
 * means "load again". An answer only counts while it belongs to the current function, so a slow old answer can
 * never replace a newer one, and "loading" is derived instead of being set inside the effect.
 */
export function useCargar<T>(cargar: () => Promise<T>): [Carga<T>, () => void] {
  const [intento, setIntento] = useState(0)
  const [guardado, setGuardado] = useState<Guardado<T> | null>(null)

  useEffect(() => {
    let vigente = true
    cargar().then(
      (datos) => {
        if (vigente) setGuardado({ cargar, intento, carga: { tipo: 'listo', datos } })
      },
      (error: unknown) => {
        if (vigente) setGuardado({ cargar, intento, carga: { tipo: 'error', error } })
      },
    )
    return () => {
      vigente = false
    }
  }, [cargar, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  const actual = guardado !== null && guardado.cargar === cargar && guardado.intento === intento
  return [actual ? guardado.carga : { tipo: 'cargando' }, recargar]
}
