// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { renderizar } from './pruebas/renderizar.ts'

/**
 * On a phone every row of a table is drawn as a card, with the column name in front of each value (CSS reads the
 * `data-label`). Drawing a table as something else makes some screen readers forget it is one, so the roles stay
 * explicit; these tests keep the labels, the roles and the real headers in step.
 */
async function biblioteca() {
  const memoria = crearApiEnMemoria()
  const { api } = memoria
  const libro = await api.libros.crear({ isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia', anioPublicacion: 2001 })
  const ejemplar = await api.ejemplares.crear(libro.id, 'EJ-1')
  const socio = await api.socios.crear({ nombre: 'Rosa Ficticia', email: 'rosa@example.org' })
  const prestamo = await api.prestamos.crear(socio.id, ejemplar.id)
  memoria.envejecerPrestamos(19)
  await api.prestamos.devolver(prestamo.id)
  return { memoria, libro }
}

describe.each([
  ['the book list', () => '/libros', 'El Faro Imaginado'],
  ['the copies of a book', (d: { libro: { id: number } }) => `/libros/${d.libro.id}`, 'EJ-1'],
  ['the member list', () => '/socios', 'Rosa Ficticia'],
  ['the loan list', () => '/prestamos', 'Devuelto'],
  ['the fine list', () => '/multas', 'Pagar'],
] as const)('the table of %s', (_nombre, ruta, esperado) => {
  it('labels every cell with the name of its column and keeps the table roles', async () => {
    const datos = await biblioteca()
    renderizar(<App />, { api: datos.memoria.api, ruta: ruta(datos) })
    await waitFor(() => expect(screen.getAllByText(esperado).length).toBeGreaterThan(0))

    const tabla = screen.getByRole('table')
    const columnas = within(tabla).getAllByRole('columnheader').map((th) => th.textContent)
    const filas = within(tabla).getAllByRole('row').slice(1)
    expect(filas.length).toBeGreaterThan(0)
    for (const fila of filas) {
      const celdas = within(fila).getAllByRole('cell')
      expect(celdas.map((td) => td.getAttribute('data-label'))).toEqual(columnas.slice(0, celdas.length))
    }
    expect(tabla.classList.contains('apilable')).toBe(true)
  })
})
