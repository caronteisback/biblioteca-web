import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useSesion } from '../sesion/useSesion.ts'
import { useTema } from '../tema/useTema.ts'
import { Icono } from './Iconos.tsx'

function iniciales(texto: string): string {
  const letras = texto
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
  return letras.join('')
}

/**
 * The person at the top right: who is signed in, the theme switch and sign out. A button that opens a small panel
 * (not an ARIA menu, which would promise arrow-key behavior): Escape, a click outside or leaving it with Tab close it.
 */
export function MenuDeUsuario({ onSalir }: { onSalir: () => void }) {
  const { sesion } = useSesion()
  const { tema, alternar } = useTema()
  const { pathname } = useLocation()
  // Open only for the screen it was opened on: going to another one closes it without an effect.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  const abierto = abiertoEn === pathname
  const setAbierto = (valor: boolean) => setAbiertoEn(valor ? pathname : null)
  const raiz = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return
    function fuera(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbiertoEn(null)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  if (!sesion) return null
  const { usuario } = sesion
  const nombre = usuario.socio?.nombre ?? usuario.email
  const rol = usuario.rol === 'LIBRARIAN' ? 'Bibliotecario' : 'Socio'

  return (
    <div
      className="usuario"
      ref={raiz}
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          setAbierto(false)
          boton.current?.focus()
        }
      }}
      onBlur={(evento) => {
        if (abierto && !raiz.current?.contains(evento.relatedTarget as Node | null)) setAbierto(false)
      }}
    >
      <button
        type="button"
        ref={boton}
        className="usuario-boton"
        aria-expanded={abierto}
        aria-controls="menu-usuario"
        onClick={() => setAbierto(!abierto)}
      >
        <span className="avatar" aria-hidden="true">
          {iniciales(nombre)}
        </span>
        <span className="usuario-texto">
          <span className="solo-lectores">Cuenta de</span> <strong>{nombre}</strong> <small>{rol}</small>
        </span>
        <Icono nombre="chevron" tamano={16} />
      </button>
      {abierto && (
        <div id="menu-usuario" className="usuario-panel">
          <p className="usuario-correo">{usuario.email}</p>
          <button type="button" onClick={alternar}>
            <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} />
            {tema === 'oscuro' ? 'Usar tema claro' : 'Usar tema oscuro'}
          </button>
          <button type="button" onClick={onSalir}>
            <Icono nombre="salir" />
            Salir
          </button>
        </div>
      )}
    </div>
  )
}
