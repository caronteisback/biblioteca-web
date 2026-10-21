import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Rol } from '../api/cliente.ts'
import { useSesion } from '../sesion/useSesion.ts'
import { SinPermiso } from './SinPermiso.tsx'

/**
 * Lets the screen through only to someone who is signed in and, when `roles` is given, has one of those roles.
 * Without a session it sends the user to the sign-in and remembers where they were going. With the wrong role
 * it says so instead of showing a screen whose every call the API would refuse.
 *
 * This hides screens, it does not protect data: the API checks the token and the role on every call.
 */
export function RutaProtegida({ roles, children }: { roles?: readonly Rol[]; children: ReactNode }) {
  const { sesion } = useSesion()
  const ubicacion = useLocation()

  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />
  }
  if (roles && !roles.includes(sesion.usuario.rol)) {
    return <SinPermiso />
  }
  return children
}
