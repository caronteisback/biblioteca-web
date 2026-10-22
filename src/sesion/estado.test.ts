// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REGLAS } from '../pruebas/reglas.ts'
import {
  avisoDeCierre,
  cerrarSesion,
  iniciarSesion,
  obtenerSesion,
  recargarSesionParaPruebas,
  reiniciarSesionParaPruebas,
  suscribir,
  type Sesion,
} from './estado.ts'

const sesion = (expiraEn: string, rol: 'LIBRARIAN' | 'MEMBER' = 'LIBRARIAN'): Sesion => ({
  token: 'un-token',
  expiraEn,
  usuario: { id: 1, email: 'bibliotecaria@example.org', rol, socio: null, reglas: REGLAS },
})
const enUnaHora = () => new Date(Date.now() + 3_600_000).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  reiniciarSesionParaPruebas()
})

afterEach(() => {
  reiniciarSesionParaPruebas()
  vi.useRealTimers()
})

describe('the session of the tab', () => {
  it('starts with nobody signed in', () => {
    expect(obtenerSesion()).toBeNull()
    expect(avisoDeCierre()).toBeNull()
  })

  it('keeps the session, and a reload of the page finds it again', () => {
    iniciarSesion(sesion(enUnaHora()))

    expect(obtenerSesion()?.token).toBe('un-token')
    recargarSesionParaPruebas()
    expect(obtenerSesion()?.usuario.email).toBe('bibliotecaria@example.org')
  })

  it('forgets the session when it ends on purpose, with nothing to say', () => {
    iniciarSesion(sesion(enUnaHora()))

    cerrarSesion()

    expect(obtenerSesion()).toBeNull()
    expect(avisoDeCierre()).toBeNull()
    recargarSesionParaPruebas()
    expect(obtenerSesion()).toBeNull()
  })

  it('does not believe a stored session that expired', () => {
    sessionStorage.setItem('biblioteca.sesion', JSON.stringify(sesion(new Date(Date.now() - 1000).toISOString())))

    recargarSesionParaPruebas()

    expect(obtenerSesion()).toBeNull()
    expect(sessionStorage.getItem('biblioteca.sesion')).toBeNull()
  })

  it.each([
    ['text that is not JSON', 'esto no es json'],
    ['a value that is not a session', JSON.stringify({ token: 5 })],
    ['a session with an unknown role', JSON.stringify(sesion(enUnaHora(), 'ADMIN' as 'MEMBER'))],
    ['a session without a token', JSON.stringify({ ...sesion(enUnaHora()), token: '' })],
    ['a session with an expiry that is not a date', JSON.stringify({ ...sesion('mañana') })],
  ])('starts signed out when the storage holds %s', (_que, contenido) => {
    sessionStorage.setItem('biblioteca.sesion', contenido)

    recargarSesionParaPruebas()

    expect(obtenerSesion()).toBeNull()
  })

  it('ends by itself when the token expires, and says why', () => {
    iniciarSesion(sesion(new Date(Date.now() + 60_000).toISOString()))

    vi.advanceTimersByTime(59_000)
    expect(obtenerSesion()).not.toBeNull()
    vi.advanceTimersByTime(2_000)

    expect(obtenerSesion()).toBeNull()
    expect(avisoDeCierre()).toBe('Tu sesión caducó. Entra de nuevo.')
  })

  it('says the session is no longer valid when the API refused the token', () => {
    iniciarSesion(sesion(enUnaHora()))

    cerrarSesion('rechazada')

    expect(avisoDeCierre()).toBe('Tu sesión ya no es válida. Entra de nuevo.')
  })

  it('forgets the notice when someone signs in again', () => {
    iniciarSesion(sesion(enUnaHora()))
    cerrarSesion('caducada')

    iniciarSesion(sesion(enUnaHora()))

    expect(avisoDeCierre()).toBeNull()
  })

  it('tells whoever is listening about every change, until they stop listening', () => {
    const oyente = vi.fn()
    const dejarDeOir = suscribir(oyente)

    iniciarSesion(sesion(enUnaHora()))
    cerrarSesion()
    expect(oyente).toHaveBeenCalledTimes(2)

    dejarDeOir()
    iniciarSesion(sesion(enUnaHora()))
    expect(oyente).toHaveBeenCalledTimes(2)
  })
})
