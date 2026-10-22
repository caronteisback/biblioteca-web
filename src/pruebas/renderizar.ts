import { cleanup, render } from '@testing-library/react'
import { createElement, type ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach } from 'vitest'
import type { Api, Pagina, Rol } from '../api/cliente.ts'
import { ApiContext } from '../api/contexto.ts'
import { guardarPlegado } from '../lateral/plegado.ts'
import { iniciarSesion, reiniciarSesionParaPruebas, type Sesion } from '../sesion/estado.ts'
import { reiniciarTemaParaPruebas } from '../tema/estado.ts'
import { REGLAS } from './reglas.ts'

afterEach(() => {
  cleanup()
  reiniciarSesionParaPruebas()
  reiniciarTemaParaPruebas()
  guardarPlegado(false)
})

/** A session as the sign-in would leave it, valid for an hour. */
export function sesionDe(rol: Rol, email = rol === 'LIBRARIAN' ? 'bibliotecaria@example.org' : 'socio@example.org'): Sesion {
  return {
    token: `token-de-${email}`,
    expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
    usuario: { id: 1, email, rol, socio: null, reglas: REGLAS },
  }
}

/**
 * Draws a screen with a fake API and an in-memory address, as the app would be at `ruta`. The user is a signed-in
 * librarian unless `sesion` says otherwise (a role, a ready session, or null for nobody).
 */
export function renderizar(ui: ReactElement, opciones: { api?: unknown; ruta?: string; sesion?: Rol | Sesion | null } = {}) {
  const { api = {}, ruta = '/', sesion = 'LIBRARIAN' } = opciones
  reiniciarSesionParaPruebas()
  if (sesion) iniciarSesion(typeof sesion === 'string' ? sesionDe(sesion) : sesion)
  return render(
    createElement(ApiContext, { value: api as Api }, createElement(MemoryRouter, { initialEntries: [ruta] }, ui)),
  )
}

/** One page of a list, holding all the items. */
export function pagina<T>(items: T[]): Pagina<T> {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: items.length > 0 ? 1 : 0 }
}
