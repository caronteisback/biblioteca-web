// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { crearApiEnMemoria } from '../pruebas/apiEnMemoria.ts'
import { abrirMenuDeUsuario } from '../pruebas/menu.ts'
import { renderizar } from '../pruebas/renderizar.ts'
import { cambiarTema, obtenerTema, reiniciarTemaParaPruebas } from './estado.ts'

beforeEach(reiniciarTemaParaPruebas)

describe('the theme', () => {
  it('is light until someone chooses', () => {
    expect(obtenerTema()).toBe('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
  })

  it('switches from the user menu, marks the page and is remembered', async () => {
    renderizar(<App />, { api: crearApiEnMemoria().api, ruta: '/libros' })

    await abrirMenuDeUsuario()
    await userEvent.click(screen.getByRole('button', { name: 'Usar tema oscuro' }))

    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem('biblioteca.tema')).toBe('oscuro')
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }))
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(localStorage.getItem('biblioteca.tema')).toBe('claro')
  })

  it('is read again from the storage when the page opens, and anything odd means light', async () => {
    localStorage.setItem('biblioteca.tema', 'oscuro')
    vi.resetModules()
    const recien = await import('./estado.ts')
    expect(recien.obtenerTema()).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')

    localStorage.setItem('biblioteca.tema', 'rosa')
    vi.resetModules()
    expect((await import('./estado.ts')).obtenerTema()).toBe('claro')
  })

  it('still switches when the storage is blocked, it just is not remembered', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    cambiarTema('oscuro')

    expect(document.documentElement.dataset.tema).toBe('oscuro')
    vi.restoreAllMocks()
  })
})
