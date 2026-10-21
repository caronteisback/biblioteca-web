import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { Buscador } from '../componentes/Buscador.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { Paginacion } from '../componentes/Paginacion.tsx'
import { useBusqueda } from '../hooks/useBusqueda.ts'
import { useCargar } from '../hooks/useCargar.ts'

const POR_PAGINA = 10

export function LibrosPagina() {
  const api = useApi()
  const { q, pagina, buscar, irA } = useBusqueda()
  const cargar = useCallback(
    () => api.libros.listar({ q: q || undefined, page: pagina, size: POR_PAGINA }),
    [api, q, pagina],
  )
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <div className="titulo-con-accion">
        <h1>Libros</h1>
        <Link className="boton" to="/libros/nuevo">
          Nuevo libro
        </Link>
      </div>
      <Buscador valor={q} etiqueta="Título o autor" alBuscar={buscar} />
      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) =>
          lista.items.length === 0 ? (
            <p>{q ? 'Ningún libro coincide con la búsqueda.' : 'Todavía no hay libros en el catálogo.'}</p>
          ) : (
            <>
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Título</th>
                      <th scope="col">Autor</th>
                      <th scope="col">ISBN</th>
                      <th scope="col">Año</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.items.map((libro) => (
                      <tr key={libro.id}>
                        <td>
                          <Link to={`/libros/${libro.id}`}>{libro.titulo}</Link>
                        </td>
                        <td>{libro.autor}</td>
                        <td>{libro.isbn}</td>
                        <td>{libro.anioPublicacion ?? '—'}</td>
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
