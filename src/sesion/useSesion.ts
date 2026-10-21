import { useSyncExternalStore } from 'react'
import type { Rol } from '../api/cliente.ts'
import { avisoDeCierre, huboSalidaVoluntaria, obtenerSesion, suscribir } from './estado.ts'

/** The signed-in user of this tab, and why the last session ended if it ended on its own. Re-renders when either changes. */
export function useSesion() {
  const sesion = useSyncExternalStore(suscribir, obtenerSesion)
  const aviso = useSyncExternalStore(suscribir, avisoDeCierre)
  const salioAProposito = useSyncExternalStore(suscribir, huboSalidaVoluntaria)
  const rol: Rol | null = sesion?.usuario.rol ?? null
  return { sesion, rol, aviso, salioAProposito }
}
