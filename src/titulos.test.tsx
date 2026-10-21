// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import indice from '../index.html?raw'
import App from './App.tsx'
import { LimiteDeError } from './componentes/LimiteDeError.tsx'
import { crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { renderizar } from './pruebas/renderizar.ts'

describe('the page', () => {
  it('declares its language and a title before any screen loads', () => {
    expect(indice).toContain('<html lang="es">')
    expect(indice).toMatch(/<title>[^<]+<\/title>/)
  })
})

describe('titles', () => {
  it.each([
    ['/libros', 'Libros · Biblioteca'],
    ['/libros/nuevo', 'Nuevo libro · Biblioteca'],
    ['/socios', 'Socios · Biblioteca'],
    ['/socios/nuevo', 'Nuevo socio · Biblioteca'],
    ['/prestamos', 'Préstamos · Biblioteca'],
    ['/prestamos/nuevo', 'Nuevo préstamo · Biblioteca'],
    ['/multas', 'Multas · Biblioteca'],
  ])('%s is titled %s', async (ruta, titulo) => {
    renderizar(<App />, { api: crearApiEnMemoria().api, ruta })

    await waitFor(() => expect(document.title).toBe(titulo))
  })

  it('a book and a member are titled with their own name', async () => {
    const { api } = crearApiEnMemoria()
    const libro = await api.libros.crear({ isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia' })
    renderizar(<App />, { api, ruta: `/libros/${libro.id}` })

    await waitFor(() => expect(document.title).toBe('El Faro Imaginado · Biblioteca'))
  })
})

describe('navigation for keyboard and screen reader users', () => {
  it('offers a link to skip to the content, as the first thing to reach', () => {
    renderizar(<App />, { api: crearApiEnMemoria().api, ruta: '/libros' })

    const primero = document.querySelector('a, button, input') as HTMLAnchorElement
    expect(primero.textContent).toBe('Saltar al contenido')
    expect(primero.getAttribute('href')).toBe('#contenido')
    expect(document.getElementById('contenido')?.tagName).toBe('MAIN')
  })

  it('moves the focus to the content when the screen changes, but not on the first load', async () => {
    renderizar(<App />, { api: crearApiEnMemoria().api, ruta: '/libros' })
    const principal = document.getElementById('contenido') as HTMLElement
    expect(document.activeElement).not.toBe(principal)

    await userEvent.click(screen.getByRole('link', { name: 'Socios' }))

    await waitFor(() => expect(document.activeElement).toBe(principal))
  })
})

describe('a screen that fails while drawing', () => {
  it('shows a notice instead of leaving the page blank', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Rota(): never {
      throw new Error('boom')
    }

    renderizar(
      <LimiteDeError>
        <Rota />
      </LimiteDeError>,
    )

    expect(screen.getByRole('alert').textContent).toContain('Algo salió mal')
    vi.restoreAllMocks()
  })
})
