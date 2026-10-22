import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { Buscador } from '../componentes/Buscador.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { Estado } from '../componentes/Estado.tsx'
import { Paginacion } from '../componentes/Paginacion.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useBusqueda } from '../hooks/useBusqueda.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { formatearDia } from '../formato.ts'

const POR_PAGINA = 10

export function SociosPagina() {
  const api = useApi()
  const { q, pagina, buscar, irA } = useBusqueda()
  const cargar = useCallback(
    () => api.socios.listar({ q: q || undefined, page: pagina, size: POR_PAGINA }),
    [api, q, pagina],
  )
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <Titulo texto="Socios" />
      <div className="titulo-con-accion">
        <h1>Socios</h1>
        <Link className="boton" to="/socios/nuevo">
          Nuevo socio
        </Link>
      </div>
      <Buscador valor={q} etiqueta="Nombre o correo" alBuscar={buscar} />
      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) =>
          lista.items.length === 0 ? (
            <p>{q ? 'Ningún socio coincide con la búsqueda.' : 'Todavía no hay socios registrados.'}</p>
          ) : (
            <>
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Correo</th>
                      <th scope="col">Registrado</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.items.map((socio) => (
                      <tr key={socio.id}>
                        <td>
                          <Link to={`/socios/${socio.id}`}>{socio.nombre}</Link>
                        </td>
                        <td>{socio.email}</td>
                        <td>{formatearDia(socio.fechaRegistro)}</td>
                        <td>
                          <Estado tono={socio.activo ? 'ok' : 'neutro'}>{socio.activo ? 'Activo' : 'Desactivado'}</Estado>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="detalle">El puntaje se ve al abrir cada socio: calcularlo para toda la lista sería lento.</p>
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
