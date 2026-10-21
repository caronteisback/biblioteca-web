import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { EtiquetaDePrestamo } from '../componentes/EtiquetaDePrestamo.tsx'
import { Paginacion } from '../componentes/Paginacion.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useParametrosDeLista } from '../hooks/useParametrosDeLista.ts'
import { formatearDia } from '../formato.ts'

const POR_PAGINA = 10

const ACTIVO = { activos: true, devueltos: false } as const

export function PrestamosPagina() {
  const api = useApi()
  const { valores, pagina, cambiar, irA } = useParametrosDeLista(['estado', 'socioId'])
  const { estado, socioId } = valores
  const socio = Number.parseInt(socioId, 10)
  const activo = estado === 'activos' || estado === 'devueltos' ? ACTIVO[estado] : undefined

  const cargar = useCallback(
    () =>
      api.prestamos.listar({
        socioId: Number.isInteger(socio) && socio > 0 ? socio : undefined,
        activo,
        page: pagina,
        size: POR_PAGINA,
      }),
    [api, socio, activo, pagina],
  )
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <Titulo texto="Préstamos" />
      <div className="titulo-con-accion">
        <h1>Préstamos</h1>
        <Link className="boton" to="/prestamos/nuevo">
          Nuevo préstamo
        </Link>
      </div>

      <div className="buscador">
        <label>
          Mostrar
          <select value={estado} onChange={(e) => cambiar({ estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="devueltos">Solo devueltos</option>
          </select>
        </label>
        {socioId && (
          <p className="detalle">
            Del socio <Link to={`/socios/${socioId}`}>#{socioId}</Link>{' '}
            <button type="button" onClick={() => cambiar({ socioId: '' })}>
              Quitar filtro
            </button>
          </p>
        )}
      </div>

      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) =>
          lista.items.length === 0 ? (
            <p>No hay préstamos con esos filtros.</p>
          ) : (
            <>
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Préstamo</th>
                      <th scope="col">Socio</th>
                      <th scope="col">Ejemplar</th>
                      <th scope="col">Prestado</th>
                      <th scope="col">Vence</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.items.map((prestamo) => (
                      <tr key={prestamo.id}>
                        <td>
                          <Link to={`/prestamos/${prestamo.id}`}>#{prestamo.id}</Link>
                        </td>
                        <td>
                          <Link to={`/socios/${prestamo.socioId}`}>#{prestamo.socioId}</Link>
                        </td>
                        <td>#{prestamo.ejemplarId}</td>
                        <td>{formatearDia(prestamo.fechaPrestamo)}</td>
                        <td>{formatearDia(prestamo.fechaVencimiento)}</td>
                        <td>
                          <EtiquetaDePrestamo prestamo={prestamo} />
                        </td>
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
