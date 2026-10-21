import { NavLink, Outlet } from 'react-router'

export function Layout() {
  return (
    <>
      <header className="cabecera">
        <strong className="marca">Biblioteca</strong>
        <nav aria-label="Principal">
          <NavLink to="/libros">Libros</NavLink>
          <NavLink to="/socios">Socios</NavLink>
          <NavLink to="/prestamos">Préstamos</NavLink>
          <NavLink to="/multas">Multas</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
