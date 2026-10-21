import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { EjemplaresDelLibro } from '../componentes/EjemplaresDelLibro.tsx'
import { NoEncontrada } from '../componentes/NoEncontrada.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useIdDeRuta } from '../hooks/useIdDeRuta.ts'

export function LibroDetallePagina() {
  const id = useIdDeRuta()
  return id === null ? <NoEncontrada que="El libro" /> : <LibroDetalle id={id} />
}

function LibroDetalle({ id }: { id: number }) {
  const api = useApi()
  const navegar = useNavigate()
  const cargar = useCallback(() => api.libros.obtener(id), [api, id])
  const [carga, recargar] = useCargar(cargar)
  const [errorAccion, setErrorAccion] = useState<unknown>(null)

  async function eliminar() {
    if (!window.confirm('¿Eliminar este libro? Solo es posible si no tiene ejemplares.')) return
    setErrorAccion(null)
    try {
      await api.libros.eliminar(id)
      navegar('/libros')
    } catch (error) {
      setErrorAccion(error)
    }
  }

  return (
    <section>
      <p>
        <Link to="/libros">← Libros</Link>
      </p>
      <CargaVista carga={carga} reintentar={recargar}>
        {(libro) => (
          <>
            <h1>{libro.titulo}</h1>
            <dl className="ficha">
              <dt>Autor</dt>
              <dd>{libro.autor}</dd>
              <dt>ISBN</dt>
              <dd>{libro.isbn}</dd>
              <dt>Año de publicación</dt>
              <dd>{libro.anioPublicacion ?? 'No consta'}</dd>
            </dl>
            <div className="acciones">
              <Link className="boton" to={`/libros/${libro.id}/editar`}>
                Editar
              </Link>
              <button type="button" className="peligro" onClick={() => void eliminar()}>
                Eliminar libro
              </button>
            </div>
            {errorAccion !== null && <AvisoError error={errorAccion} />}
            <EjemplaresDelLibro libroId={libro.id} />
          </>
        )}
      </CargaVista>
    </section>
  )
}
