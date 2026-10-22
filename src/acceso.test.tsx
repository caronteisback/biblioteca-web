// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { BIBLIOTECARIA, crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { salirDelPanel } from './pruebas/menu.ts'
import { renderizar, sesionDe } from './pruebas/renderizar.ts'
import { obtenerSesion } from './sesion/estado.ts'

/** A library with a book and its copy, a member with an account and a loan of their own. */
async function biblioteca() {
  const memoria = crearApiEnMemoria()
  const { api } = memoria
  const libro = await api.libros.crear({ isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia', anioPublicacion: 2001 })
  const ejemplar = await api.ejemplares.crear(libro.id, 'EJ-1')
  const socio = await api.socios.crear({ nombre: 'Rosa Ficticia', email: 'rosa@example.org' })
  memoria.abrirCuenta(socio.id, 'rosa@example.org', 'una-contrasena-larga')
  await api.prestamos.crear(socio.id, ejemplar.id)
  return { memoria, api, libro, socio }
}

describe('who sees what', () => {
  it('sends someone who is not signed in to the sign-in, whatever the address', async () => {
    const { api } = await biblioteca()

    renderizar(<App />, { api, ruta: '/socios', sesion: null })

    expect(await screen.findByRole('heading', { name: 'Biblioteca' })).toBeTruthy()
    expect(screen.getByLabelText('Correo')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Principal' })).toBeNull()
  })

  it('signs in and lands where the user was going', async () => {
    const { api } = await biblioteca()
    renderizar(<App />, { api, ruta: '/multas', sesion: null })

    await userEvent.type(await screen.findByLabelText('Correo'), BIBLIOTECARIA.email)
    await userEvent.type(screen.getByLabelText('Contraseña'), BIBLIOTECARIA.password)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Multas' })).toBeTruthy()
    expect(obtenerSesion()?.usuario.rol).toBe('LIBRARIAN')
  })

  it('shows a librarian the whole panel and no member screen', async () => {
    const { api } = await biblioteca()

    renderizar(<App />, { api, ruta: '/' })

    expect(await screen.findByRole('heading', { name: 'Libros' })).toBeTruthy()
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    for (const nombre of ['Libros', 'Socios', 'Préstamos', 'Multas']) {
      expect(menu.textContent).toContain(nombre)
    }
    expect(menu.textContent).not.toContain('Mi cuenta')
    expect(screen.getByRole('link', { name: 'Nuevo libro' })).toBeTruthy()
  })

  it('shows a member only the catalog and their own account', async () => {
    const { api } = await biblioteca()

    renderizar(<App />, { api, ruta: '/', sesion: sesionDe('MEMBER', 'rosa@example.org') })

    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeTruthy()
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(menu.textContent).toContain('Libros')
    expect(menu.textContent).toContain('Mi cuenta')
    for (const nombre of ['Socios', 'Préstamos', 'Multas']) {
      expect(menu.textContent).not.toContain(nombre)
    }
  })

  it.each(['/socios', '/socios/1', '/socios/nuevo', '/prestamos', '/prestamos/nuevo', '/multas', '/libros/nuevo', '/libros/1/editar'])(
    'tells a member that %s is not for them, without calling the API',
    async (ruta) => {
      const { api } = await biblioteca()

      renderizar(<App />, { api, ruta, sesion: sesionDe('MEMBER', 'rosa@example.org') })

      expect(await screen.findByRole('heading', { name: 'Sin permiso' })).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Ir a mi inicio' }).getAttribute('href')).toBe('/cuenta')
    },
  )

  it('tells a librarian that "my account" is not for them', async () => {
    const { api } = await biblioteca()

    renderizar(<App />, { api, ruta: '/cuenta' })

    expect(await screen.findByRole('heading', { name: 'Sin permiso' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir a mi inicio' }).getAttribute('href')).toBe('/libros')
  })

  it('signs out, forgets the session and asks to sign in again', async () => {
    const { api } = await biblioteca()
    renderizar(<App />, { api, ruta: '/libros' })

    await salirDelPanel()

    expect(await screen.findByLabelText('Correo')).toBeTruthy()
    expect(obtenerSesion()).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not send the next person who signs in to the screen the previous one was on', async () => {
    const { api } = await biblioteca()
    renderizar(<App />, { api, ruta: '/libros' })
    await salirDelPanel()

    await userEvent.type(await screen.findByLabelText('Correo'), 'rosa@example.org')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'una-contrasena-larga')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeTruthy()
  })

  it('returns to the sign-in, saying why, when the session ends by itself', async () => {
    const { api } = await biblioteca()
    renderizar(<App />, { api, ruta: '/libros' })
    await screen.findByRole('heading', { name: 'Libros' })

    const { cerrarSesion } = await import('./sesion/estado.ts')
    cerrarSesion('rechazada')

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Tu sesión ya no es válida. Entra de nuevo.'))
  })

  it('shows who is signed in', async () => {
    const { api } = await biblioteca()

    renderizar(<App />, { api, ruta: '/libros', sesion: sesionDe('MEMBER', 'rosa@example.org') })

    expect(await screen.findByText('rosa@example.org')).toBeTruthy()
  })
})

describe('a member reads the catalog and cannot change it', () => {
  it('has no button to create, edit, delete or lend', async () => {
    const { api, libro } = await biblioteca()
    renderizar(<App />, { api, ruta: '/libros', sesion: sesionDe('MEMBER', 'rosa@example.org') })

    expect(await screen.findByRole('link', { name: 'El Faro Imaginado' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Nuevo libro' })).toBeNull()

    await userEvent.click(screen.getByRole('link', { name: 'El Faro Imaginado' }))
    expect(await screen.findByRole('heading', { name: 'El Faro Imaginado' })).toBeTruthy()
    expect(await screen.findByText('EJ-1')).toBeTruthy()
    for (const nombre of ['Editar', 'Eliminar libro', 'Agregar ejemplar', 'Dar de baja', 'Eliminar', 'Prestar']) {
      expect(screen.queryByRole('button', { name: nombre }) ?? screen.queryByRole('link', { name: nombre })).toBeNull()
    }
    expect(screen.queryByLabelText('Código del nuevo ejemplar')).toBeNull()
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).toBeNull()
    expect(libro.id).toBeGreaterThan(0)
  })

  it('the librarian does see them', async () => {
    const { api } = await biblioteca()
    renderizar(<App />, { api, ruta: '/libros' })

    await userEvent.click(await screen.findByRole('link', { name: 'El Faro Imaginado' }))

    expect(await screen.findByRole('link', { name: 'Editar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Eliminar libro' })).toBeTruthy()
    expect(await screen.findByRole('columnheader', { name: 'Acciones' })).toBeTruthy()
    expect(screen.getByLabelText('Código del nuevo ejemplar')).toBeTruthy()
  })
})
