import type { Rol } from '../api/cliente.ts'

/** Where each role starts: the librarian in the catalog, the member in their own account. Nobody signed in goes to sign in. */
export function inicioDe(rol: Rol | null): string {
  if (rol === 'LIBRARIAN') return '/libros'
  if (rol === 'MEMBER') return '/cuenta'
  return '/login'
}

/** The catalog screens that a member may read (the list and one book), with any search in the address. */
const LECTURA_DE_SOCIO = /^\/libros(\/\d+)?(\?.*)?$/

/**
 * Where to go after signing in. The user is taken back to the screen they were heading for, but only when their
 * role can see it: a member who asked for /socios before signing in lands in their account, not on a refusal.
 */
export function destinoTrasEntrar(rol: Rol, pedido: string | null): string {
  if (pedido === null) return inicioDe(rol)
  if (rol === 'LIBRARIAN') return pedido.startsWith('/cuenta') ? inicioDe(rol) : pedido
  return LECTURA_DE_SOCIO.test(pedido) ? pedido : inicioDe(rol)
}
