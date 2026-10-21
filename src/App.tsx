import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout.tsx'
import { NoEncontrada } from './componentes/NoEncontrada.tsx'
import { LibroDetallePagina } from './paginas/LibroDetallePagina.tsx'
import { LibroFormPagina } from './paginas/LibroFormPagina.tsx'
import { LibrosPagina } from './paginas/LibrosPagina.tsx'
import { SocioDetallePagina } from './paginas/SocioDetallePagina.tsx'
import { SocioFormPagina } from './paginas/SocioFormPagina.tsx'
import { SociosPagina } from './paginas/SociosPagina.tsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/libros" replace />} />
        <Route path="libros" element={<LibrosPagina />} />
        <Route path="libros/nuevo" element={<LibroFormPagina />} />
        <Route path="libros/:id" element={<LibroDetallePagina />} />
        <Route path="libros/:id/editar" element={<LibroFormPagina edicion />} />
        <Route path="socios" element={<SociosPagina />} />
        <Route path="socios/nuevo" element={<SocioFormPagina />} />
        <Route path="socios/:id" element={<SocioDetallePagina />} />
        <Route path="socios/:id/editar" element={<SocioFormPagina edicion />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}

export default App
