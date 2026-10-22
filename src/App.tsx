import { Navigate, Outlet, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout.tsx'
import { NoEncontrada } from './componentes/NoEncontrada.tsx'
import { RutaProtegida } from './componentes/RutaProtegida.tsx'
import { LibroDetallePagina } from './paginas/LibroDetallePagina.tsx'
import { LibroFormPagina } from './paginas/LibroFormPagina.tsx'
import { InicioPagina } from './paginas/InicioPagina.tsx'
import { LibrosPagina } from './paginas/LibrosPagina.tsx'
import { LoginPagina } from './paginas/LoginPagina.tsx'
import { MiCuentaPagina } from './paginas/MiCuentaPagina.tsx'
import { MultasPagina } from './paginas/MultasPagina.tsx'
import { NuevoPrestamoPagina } from './paginas/NuevoPrestamoPagina.tsx'
import { PrestamoDetallePagina } from './paginas/PrestamoDetallePagina.tsx'
import { PrestamosPagina } from './paginas/PrestamosPagina.tsx'
import { SocioDetallePagina } from './paginas/SocioDetallePagina.tsx'
import { SocioFormPagina } from './paginas/SocioFormPagina.tsx'
import { SociosPagina } from './paginas/SociosPagina.tsx'
import { inicioDe } from './sesion/inicio.ts'
import { useSesion } from './sesion/useSesion.ts'

function Inicio() {
  const { rol } = useSesion()
  return <Navigate to={inicioDe(rol)} replace />
}

/**
 * The screens, by who may see them. The catalog is for both roles (the member only reads it); the rest of the
 * panel is for librarians, and "Mi cuenta" for members. The API enforces the same rules on every call.
 */
function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPagina />} />
      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Inicio />} />
        <Route
          path="inicio"
          element={
            <RutaProtegida roles={['MEMBER']}>
              <InicioPagina />
            </RutaProtegida>
          }
        />
        <Route path="libros" element={<LibrosPagina />} />
        <Route
          element={
            <RutaProtegida roles={['LIBRARIAN']}>
              <Outlet />
            </RutaProtegida>
          }
        >
          <Route path="libros/nuevo" element={<LibroFormPagina />} />
          <Route path="libros/:id/editar" element={<LibroFormPagina edicion />} />
          <Route path="socios" element={<SociosPagina />} />
          <Route path="socios/nuevo" element={<SocioFormPagina />} />
          <Route path="socios/:id" element={<SocioDetallePagina />} />
          <Route path="socios/:id/editar" element={<SocioFormPagina edicion />} />
          <Route path="prestamos" element={<PrestamosPagina />} />
          <Route path="prestamos/nuevo" element={<NuevoPrestamoPagina />} />
          <Route path="prestamos/:id" element={<PrestamoDetallePagina />} />
          <Route path="multas" element={<MultasPagina />} />
        </Route>
        <Route path="libros/:id" element={<LibroDetallePagina />} />
        <Route
          path="cuenta"
          element={
            <RutaProtegida roles={['MEMBER']}>
              <MiCuentaPagina />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}

export default App
