// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAJES } from '../api/errores.ts'
import { renderizar } from '../pruebas/renderizar.ts'
import { cerrarSesion, obtenerSesion } from '../sesion/estado.ts'
import { LoginPagina } from './LoginPagina.tsx'
import { REGLAS } from '../pruebas/reglas.ts'

const respuesta = (rol: 'LIBRARIAN' | 'MEMBER') => ({
  token: 'el-token',
  tipo: 'Bearer',
  expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
  usuario: { id: 1, email: 'ana@example.org', rol, socio: null, reglas: REGLAS },
})

function pantalla(entrar: unknown, ruta = '/login', estado?: unknown) {
  renderizar(
    <Routes>
      <Route path="/login" element={<LoginPagina />} />
      <Route path="/libros" element={<p>Pantalla de libros</p>} />
      <Route path="/inicio" element={<p>Pantalla de inicio</p>} />
      <Route path="/prestamos" element={<p>Pantalla de préstamos</p>} />
    </Routes>,
    { api: { auth: { entrar } }, ruta: estado ? ({ pathname: ruta, state: estado } as unknown as string) : ruta, sesion: null },
  )
}

async function rellenar(email = 'ana@example.org', password = 'una-contrasena-larga') {
  await userEvent.type(screen.getByLabelText('Correo'), email)
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPagina', () => {
  it('signs a librarian in and opens the home', async () => {
    const entrar = vi.fn().mockResolvedValue(respuesta('LIBRARIAN'))
    pantalla(entrar)

    await rellenar('  ana@example.org ')

    expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
    expect(entrar).toHaveBeenCalledWith('ana@example.org', 'una-contrasena-larga')
    expect(obtenerSesion()?.token).toBe('el-token')
  })

  it('opens the home for a member', async () => {
    pantalla(vi.fn().mockResolvedValue(respuesta('MEMBER')))

    await rellenar()

    expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
  })

  it('goes where the user was heading before being asked to sign in', async () => {
    pantalla(vi.fn().mockResolvedValue(respuesta('LIBRARIAN')), '/login', { desde: '/prestamos?estado=activos' })

    await rellenar()

    expect(await screen.findByText('Pantalla de préstamos')).toBeTruthy()
  })

  it('does not send a member to a screen that is not theirs, even if they were heading there', async () => {
    pantalla(vi.fn().mockResolvedValue(respuesta('MEMBER')), '/login', { desde: '/prestamos' })

    await rellenar()

    expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
  })

  it.each(['https://sitio-ajeno.example/robo', '//sitio-ajeno.example', 'javascript:alert(1)'])(
    'ignores a destination that is not an address of the panel (%s)',
    async (desde) => {
      pantalla(vi.fn().mockResolvedValue(respuesta('LIBRARIAN')), '/login', { desde })

      await rellenar()

      expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
    },
  )

  it('says in Spanish that the credentials are wrong, empties the password and lets the user try again', async () => {
    const entrar = vi.fn().mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'The email or the password is not correct.'))
    pantalla(entrar)

    await rellenar()

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.INVALID_CREDENTIALS)
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('ana@example.org')
    expect((screen.getByRole('button', { name: 'Entrar' }) as HTMLButtonElement).disabled).toBe(false)
    expect(obtenerSesion()).toBeNull()
  })

  it('says so when the email is locked after too many attempts', async () => {
    pantalla(vi.fn().mockRejectedValue(new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many failed attempts.')))

    await rellenar()

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.TOO_MANY_ATTEMPTS)
  })

  it('says that the API cannot be reached', async () => {
    pantalla(vi.fn().mockRejectedValue(new ApiError(0, null, null)))

    await rellenar()

    expect((await screen.findByRole('alert')).textContent).toBe('No se pudo contactar con la API.')
  })

  it('is not sent twice while it waits', async () => {
    let terminar: (valor: unknown) => void = () => {}
    const entrar = vi.fn().mockReturnValue(new Promise((ok) => (terminar = ok)))
    pantalla(entrar)

    await rellenar()

    const boton = screen.getByRole('button', { name: 'Entrando…' }) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
    terminar(respuesta('LIBRARIAN'))
    expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
  })

  it('tells why the previous session ended', async () => {
    pantalla(vi.fn())
    cerrarSesion('caducada')

    expect(await screen.findByRole('status')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Tu sesión caducó. Entra de nuevo.')
  })

  it('skips the form for someone who is already signed in', async () => {
    renderizar(
      <Routes>
        <Route path="/login" element={<LoginPagina />} />
        <Route path="/inicio" element={<p>Pantalla de inicio</p>} />
      </Routes>,
      { api: {}, ruta: '/login', sesion: 'LIBRARIAN' },
    )

    expect(await screen.findByText('Pantalla de inicio')).toBeTruthy()
  })
})
