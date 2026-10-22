import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { guardarPlegado, leerPlegado } from '../lateral/plegado.ts'
import { cerrarSesion } from '../sesion/estado.ts'
import { useSesion } from '../sesion/useSesion.ts'
import { Icono, type NombreDeIcono } from './Iconos.tsx'
import { LimiteDeError } from './LimiteDeError.tsx'
import { MenuDeUsuario } from './MenuDeUsuario.tsx'

function Entrada({ to, icono, children }: { to: string; icono: NombreDeIcono; children: string }) {
  return (
    <NavLink to={to} title={children}>
      <Icono nombre={icono} />
      <span className="texto-del-menu">{children}</span>
    </NavLink>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { rol } = useSesion()
  const principal = useRef<HTMLElement>(null)
  const primeraVez = useRef(true)
  // Open only for the screen it was opened on: choosing another screen closes it without an effect.
  const [lateralAbiertoEn, setLateralAbiertoEn] = useState<string | null>(null)
  const lateralAbierto = lateralAbiertoEn === pathname
  // On a wide screen the menu can be folded to its icons; on a phone it slides in and out instead.
  const [plegado, setPlegado] = useState(leerPlegado)
  const setLateralAbierto = (valor: boolean) => setLateralAbiertoEn(valor ? pathname : null)

  // In a single-page app the browser does not announce a new page: move the focus to the content when the
  // screen changes (not on the first load, which would steal the focus from the address bar).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false
      return
    }
    principal.current?.focus()
  }, [pathname])

  function alternarPlegado() {
    setPlegado(!plegado)
    guardarPlegado(!plegado)
  }

  function salir() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className={plegado ? 'aplicacion plegado' : 'aplicacion'} onKeyDown={(evento) => evento.key === 'Escape' && setLateralAbierto(false)}>
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>
      <aside id="lateral" className={lateralAbierto ? 'lateral abierto' : 'lateral'}>
        <strong className="marca">
          <span className="marca-corta" aria-hidden="true">
            B
          </span>
          <span className="texto-del-menu">Biblioteca</span>
        </strong>
        <nav aria-label="Principal">
          <Entrada to="/inicio" icono="inicio">
            Inicio
          </Entrada>
          <Entrada to="/libros" icono="libros">
            Libros
          </Entrada>
          {rol === 'LIBRARIAN' && (
            <>
              <Entrada to="/socios" icono="socios">
                Socios
              </Entrada>
              <Entrada to="/prestamos" icono="prestamos">
                Préstamos
              </Entrada>
              <Entrada to="/multas" icono="multas">
                Multas
              </Entrada>
            </>
          )}
          {rol === 'MEMBER' && (
            <Entrada to="/cuenta" icono="cuenta">
              Mi cuenta
            </Entrada>
          )}
        </nav>
      </aside>
      {lateralAbierto && <div className="velo" aria-hidden="true" onClick={() => setLateralAbierto(false)} />}
      <div className="contenedor">
        <header className="barra">
          <button
            type="button"
            className="hamburguesa"
            aria-label="Menú principal"
            aria-expanded={lateralAbierto}
            aria-controls="lateral"
            onClick={() => setLateralAbierto(!lateralAbierto)}
          >
            <Icono nombre="menu" tamano={20} />
          </button>
          <button
            type="button"
            className="plegador"
            aria-label={plegado ? 'Expandir el menú' : 'Contraer el menú'}
            aria-expanded={!plegado}
            aria-controls="lateral"
            onClick={alternarPlegado}
          >
            <Icono nombre="menu" tamano={20} />
          </button>
          <MenuDeUsuario onSalir={salir} />
        </header>
        <main id="contenido" tabIndex={-1} ref={principal}>
          <div className="pagina">
            <LimiteDeError key={pathname}>
              <Outlet />
            </LimiteDeError>
          </div>
        </main>
      </div>
    </div>
  )
}
