import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { LimiteDeError } from './LimiteDeError.tsx'

export function Layout() {
  const { pathname } = useLocation()
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

  return (
    <>
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <strong className="marca">Biblioteca</strong>
        <nav aria-label="Principal">
          <NavLink to="/libros">Libros</NavLink>
          <NavLink to="/socios">Socios</NavLink>
          <NavLink to="/prestamos">Préstamos</NavLink>
          <NavLink to="/multas">Multas</NavLink>
        </nav>
      </header>
      <main id="contenido" tabIndex={-1} ref={principal}>
        <LimiteDeError key={pathname}>
          <Outlet />
        </LimiteDeError>
      </main>
    </>
  )
}
