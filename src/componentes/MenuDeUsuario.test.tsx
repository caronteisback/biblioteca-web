// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { crearApiEnMemoria } from '../pruebas/apiEnMemoria.ts'
import { abrirMenuDeUsuario } from '../pruebas/menu.ts'
import { renderizar, sesionDe } from '../pruebas/renderizar.ts'

function panel() {
  renderizar(<App />, { api: crearApiEnMemoria().api, ruta: '/libros' })
}

describe('the user menu', () => {
  it('shows who is signed in and their role, and keeps the panel closed until asked', async () => {
    panel()
    const boton = await screen.findByRole('button', { name: /^Cuenta de bibliotecaria@example.org/ })

    expect(boton.textContent).toContain('Bibliotecario')
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull()

    await userEvent.click(boton)

    expect(boton.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy()
  })

  it('calls a member by their role', async () => {
    renderizar(<App />, { api: crearApiEnMemoria().api, ruta: '/libros', sesion: sesionDe('MEMBER', 'rosa@example.org') })

    expect((await screen.findByRole('button', { name: /^Cuenta de rosa@example.org/ })).textContent).toContain('Socio')
  })

  it('closes with Escape and gives the focus back to its button', async () => {
    panel()
    await abrirMenuDeUsuario()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Cuenta de / }))
  })

  it('closes with a click anywhere else', async () => {
    panel()
    await abrirMenuDeUsuario()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull()
  })

  it('closes when the screen changes', async () => {
    panel()
    await abrirMenuDeUsuario()
    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy()

    await userEvent.click(screen.getByRole('link', { name: 'Socios' }))

    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull()
  })
})

describe('the side menu on a small screen', () => {
  it('opens and closes with its button and with Escape, and closes when a screen is chosen', async () => {
    panel()
    const boton = await screen.findByRole('button', { name: 'Menú principal' })
    const lateral = document.getElementById('lateral') as HTMLElement
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(lateral.classList.contains('abierto')).toBe(false)

    await userEvent.click(boton)
    expect(boton.getAttribute('aria-expanded')).toBe('true')
    expect(lateral.classList.contains('abierto')).toBe(true)

    await userEvent.keyboard('{Escape}')
    expect(lateral.classList.contains('abierto')).toBe(false)

    await userEvent.click(boton)
    await userEvent.click(screen.getByRole('link', { name: 'Multas' }))
    expect(lateral.classList.contains('abierto')).toBe(false)
  })
})

describe('the side menu on a wide screen', () => {
  beforeEach(() => localStorage.removeItem('biblioteca.lateral'))

  it('folds to its icons and opens again, keeping every link reachable by name', async () => {
    panel()
    const boton = await screen.findByRole('button', { name: 'Contraer el menú' })
    const aplicacion = document.querySelector('.aplicacion') as HTMLElement
    expect(boton.getAttribute('aria-expanded')).toBe('true')
    expect(aplicacion.classList.contains('plegado')).toBe(false)

    await userEvent.click(boton)

    expect(aplicacion.classList.contains('plegado')).toBe(true)
    const abrir = screen.getByRole('button', { name: 'Expandir el menú' })
    expect(abrir.getAttribute('aria-expanded')).toBe('false')
    for (const nombre of ['Libros', 'Socios', 'Préstamos', 'Multas']) {
      expect(screen.getByRole('link', { name: nombre }).getAttribute('title')).toBe(nombre)
    }

    await userEvent.click(abrir)
    expect(aplicacion.classList.contains('plegado')).toBe(false)
  })

  it('remembers the choice for the next visit', async () => {
    panel()
    await userEvent.click(await screen.findByRole('button', { name: 'Contraer el menú' }))
    expect(localStorage.getItem('biblioteca.lateral')).toBe('plegado')
    cleanup()

    panel()
    expect((await screen.findByRole('button', { name: 'Expandir el menú' })).getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('.aplicacion')?.classList.contains('plegado')).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Expandir el menú' }))
    expect(localStorage.getItem('biblioteca.lateral')).toBeNull()
  })

  it('starts open when the storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    panel()

    expect((await screen.findByRole('button', { name: 'Contraer el menú' })).getAttribute('aria-expanded')).toBe('true')
    vi.restoreAllMocks()
  })
})
