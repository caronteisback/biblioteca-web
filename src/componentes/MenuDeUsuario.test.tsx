// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
