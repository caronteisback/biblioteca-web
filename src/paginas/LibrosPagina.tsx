import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { Buscador } from '../componentes/Buscador.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { Paginacion } from '../componentes/Paginacion.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useBusqueda } from '../hooks/useBusqueda.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { useSesion } from '../sesion/useSesion.ts'

const POR_PAGINA = 10

export function LibrosPagina() {
  const api = useApi()
  const { q, pagina, buscar, irA } = useBusqueda()
  const { rol } = useSesion()
  const cargar = useCallback(
    () => api.libros.listar({ q: q || undefined, page: pagina, size: POR_PAGINA }),
    [api, q, pagina],
  )
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <Titulo texto="Libros" />
      <div className="titulo-con-accion">
        <h1>Libros</h1>
        {rol === 'LIBRARIAN' && (
          <Link className="boton" to="/libros/nuevo">
            Nuevo libro
          </Link>
        )}
      </div>
      <Buscador valor={q} etiqueta="Título o autor" alBuscar={buscar} />
      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) =>
          lista.items.length === 0 ? (
            <p>{q ? 'Ningún libro coincide con la búsqueda.' : 'Todavía no hay libros en el catálogo.'}</p>
          ) : (
            <>
              <div className="tabla-scroll">
                <table className="apilable" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Título</th>
                      <th scope="col" role="columnheader">Autor</th>
                      <th scope="col" role="columnheader">ISBN</th>
                      <th scope="col" role="columnheader">Año</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {lista.items.map((libro) => (
                      <tr role="row" key={libro.id}>
                        <td role="cell" data-label="Título">
                          <Link to={`/libros/${libro.id}`}>{libro.titulo}</Link>
                        </td>
                        <td role="cell" data-label="Autor">{libro.autor}</td>
                        <td role="cell" data-label="ISBN">{libro.isbn}</td>
                        <td role="cell" data-label="Año">{libro.anioPublicacion ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacion
                pagina={lista.page}
                totalPaginas={lista.totalPages}
                totalElementos={lista.totalElements}
                alCambiar={irA}
              />
            </>
          )
        }
      </CargaVista>
    </section>
  )
}
