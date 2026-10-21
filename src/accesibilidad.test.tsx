// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { renderizar } from './pruebas/renderizar.ts'

/** A library with one of everything, so every screen has something to show. */
async function biblioteca() {
  const memoria = crearApiEnMemoria()
  const { api } = memoria
  const libro = await api.libros.crear({ isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia', anioPublicacion: 2001 })
  const ejemplar = await api.ejemplares.crear(libro.id, 'EJ-1')
  await api.ejemplares.crear(libro.id, 'EJ-2')
  const socio = await api.socios.crear({ nombre: 'Rosa Ficticia', email: 'rosa@example.org' })
  const prestamo = await api.prestamos.crear(socio.id, ejemplar.id)
  memoria.envejecerPrestamos(19)
  await api.prestamos.devolver(prestamo.id)
  return { memoria, libro, socio, prestamo }
}

/**
 * Colour contrast needs real layout and is checked in a real browser, not here. The two rules about the
 * whole document (language, title) are checked by titulos.test.tsx.
 */
const REGLAS = { 'color-contrast': { enabled: false }, 'document-title': { enabled: false }, 'html-has-lang': { enabled: false } }

async function violaciones() {
  const resultado = await axe.run(document.body, { rules: REGLAS })
  return resultado.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join('; ')})`)
}

describe('accessibility of every screen (axe)', () => {
  it.each([
    ['the book list', () => '/libros', 'El Faro Imaginado'],
    ['a new book', () => '/libros/nuevo', 'Crear libro'],
    ['a book with its copies', (d: Datos) => `/libros/${d.libro.id}`, 'EJ-2'],
    ['editing a book', (d: Datos) => `/libros/${d.libro.id}/editar`, 'Guardar cambios'],
    ['the member list', () => '/socios', 'Rosa Ficticia'],
    ['a new member', () => '/socios/nuevo', 'Registrar socio'],
    ['a member with a score and alerts', (d: Datos) => `/socios/${d.socio.id}`, /Multas pendientes/],
    ['the loan list', () => '/prestamos', 'Devuelto'],
    ['a new loan', () => '/prestamos/nuevo', 'Buscar libro'],
    ['a loan with its fine', (d: Datos) => `/prestamos/${d.prestamo.id}`, /pendiente de pago/],
    ['the fine list', () => '/multas', 'Pagar'],
    ['a page that does not exist', () => '/nada', 'No encontrado'],
  ] as const)('%s has no violations', async (_nombre, ruta, esperado) => {
    const datos = await biblioteca()
    renderizar(<App />, { api: datos.memoria.api, ruta: ruta(datos) })

    await waitFor(() => expect(screen.getAllByText(esperado).length).toBeGreaterThan(0))

    expect(await violaciones()).toEqual([])
  })
})

type Datos = Awaited<ReturnType<typeof biblioteca>>
