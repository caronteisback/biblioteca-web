import { cleanup, render } from '@testing-library/react'
import { createElement, type ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach } from 'vitest'
import type { Api, Pagina } from '../api/cliente.ts'
import { ApiContext } from '../api/contexto.ts'

afterEach(cleanup)

/** Draws a screen with a fake API and an in-memory address, as the app would be at `ruta`. */
export function renderizar(ui: ReactElement, opciones: { api?: unknown; ruta?: string } = {}) {
  const { api = {}, ruta = '/' } = opciones
  return render(
    createElement(ApiContext, { value: api as Api }, createElement(MemoryRouter, { initialEntries: [ruta] }, ui)),
  )
}

/** One page of a list, holding all the items. */
export function pagina<T>(items: T[]): Pagina<T> {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: items.length > 0 ? 1 : 0 }
}
