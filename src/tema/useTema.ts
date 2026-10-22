import { useSyncExternalStore } from 'react'
import { cambiarTema, obtenerTema, suscribirTema } from './estado.ts'

/** The theme in use and a way to flip it. Re-renders when it changes. */
export function useTema() {
  const tema = useSyncExternalStore(suscribirTema, obtenerTema)
  return { tema, alternar: () => cambiarTema(tema === 'oscuro' ? 'claro' : 'oscuro') }
}
