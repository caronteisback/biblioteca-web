import type { Usuario } from '../api/cliente.ts'

/** A signed-in user: the bearer token, the moment it stops being valid, and who it belongs to. */
export interface Sesion {
  token: string
  expiraEn: string
  usuario: Usuario
}

export type MotivoDeCierre = 'caducada' | 'rechazada'

const CLAVE = 'biblioteca.sesion'
const MENSAJES: Record<MotivoDeCierre, string> = {
  caducada: 'Tu sesión caducó. Entra de nuevo.',
  rechazada: 'Tu sesión ya no es válida. Entra de nuevo.',
}
/** setTimeout cannot wait longer than this (a 32-bit number of milliseconds). */
const ESPERA_MAXIMA = 2_147_483_647

const oyentes = new Set<() => void>()
let temporizador: ReturnType<typeof setTimeout> | undefined
let actual: Sesion | null = null
let aviso: string | null = null
let salidaVoluntaria = false

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false
  const { token, expiraEn, usuario } = valor as Partial<Sesion>
  return (
    typeof token === 'string' &&
    token.length > 0 &&
    typeof expiraEn === 'string' &&
    Number.isFinite(Date.parse(expiraEn)) &&
    typeof usuario === 'object' &&
    usuario !== null &&
    typeof usuario.email === 'string' &&
    (usuario.rol === 'LIBRARIAN' || usuario.rol === 'MEMBER')
  )
}

function avisar() {
  oyentes.forEach((oyente) => oyente())
}

function programarCierre(sesion: Sesion | null) {
  clearTimeout(temporizador)
  if (sesion) {
    const falta = Date.parse(sesion.expiraEn) - Date.now()
    temporizador = setTimeout(() => cerrarSesion('caducada'), Math.min(Math.max(falta, 0), ESPERA_MAXIMA))
  }
}

/** The session of this tab survives a reload (sessionStorage) and disappears when the tab closes. A stored one is believed only if it is well formed and not expired. */
function recuperar(): Sesion | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    const guardada: unknown = JSON.parse(crudo)
    if (esSesion(guardada) && Date.parse(guardada.expiraEn) > Date.now()) return guardada
    sessionStorage.removeItem(CLAVE)
  } catch {
    // sessionStorage can be blocked or hold something that is not JSON: start signed out.
  }
  return null
}

actual = recuperar()
programarCierre(actual)

export function obtenerSesion(): Sesion | null {
  return actual
}

/** Why the last session ended, for the login screen to say so; null after a sign-out on purpose. */
export function avisoDeCierre(): string | null {
  return aviso
}

/** True after the user chose to sign out: nobody should be sent back to the screen they were on when the next person signs in. */
export function huboSalidaVoluntaria(): boolean {
  return salidaVoluntaria
}

export function iniciarSesion(sesion: Sesion) {
  actual = sesion
  aviso = null
  salidaVoluntaria = false
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    // Without storage the session lives in memory only: it is lost on reload, nothing else changes.
  }
  programarCierre(sesion)
  avisar()
}

export function cerrarSesion(motivo?: MotivoDeCierre) {
  actual = null
  aviso = motivo ? MENSAJES[motivo] : null
  salidaVoluntaria = motivo === undefined
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // Nothing to clean if the storage is not available.
  }
  programarCierre(null)
  avisar()
}

export function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** Tests start from nothing; so does a page that was just opened. */
export function reiniciarSesionParaPruebas() {
  cerrarSesion()
  salidaVoluntaria = false
}

/** Reads the storage again, as a page that was just reloaded would. Only tests need it. */
export function recargarSesionParaPruebas() {
  actual = recuperar()
  programarCierre(actual)
  avisar()
}
