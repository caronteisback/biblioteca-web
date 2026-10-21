import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { cerrarSesion } from '../sesion/estado.ts'
import { useSesion } from '../sesion/useSesion.ts'
import { LimiteDeError } from './LimiteDeError.tsx'

export function Layout() {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { sesion, rol } = useSesion()
  const principal = useRef<HTMLElement>(null)
  const primeraVez = useRef(true)

  // In a single-page app the browser does not announce a new page: move the focus to the content when the
  // screen changes (not on the first load, which would steal the focus from the address bar).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false
      return
    }
    principal.current?.focus()
  }, [pathname])

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <>
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <strong className="marca">Biblioteca</strong>
        <nav aria-label="Principal">
          <NavLink to="/libros">Libros</NavLink>
          {rol === 'LIBRARIAN' && (
            <>
              <NavLink to="/socios">Socios</NavLink>
              <NavLink to="/prestamos">Préstamos</NavLink>
              <NavLink to="/multas">Multas</NavLink>
            </>
          )}
          {rol === 'MEMBER' && <NavLink to="/cuenta">Mi cuenta</NavLink>}
        </nav>
        {sesion && (
          <div className="usuario">
            <span title={sesion.usuario.rol === 'LIBRARIAN' ? 'Bibliotecario' : 'Socio'}>{sesion.usuario.email}</span>
            <button type="button" onClick={salir}>
              Salir
            </button>
          </div>
        )}
      </header>
      <main id="contenido" tabIndex={-1} ref={principal}>
        <LimiteDeError key={pathname}>
          <Outlet />
        </LimiteDeError>
      </main>
    </>
  )
}
