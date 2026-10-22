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
                <table className="apilable" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Préstamo</th>
                      <th scope="col" role="columnheader">Socio</th>
                      <th scope="col" role="columnheader">Libro</th>
                      <th scope="col" role="columnheader">Ejemplar</th>
                      <th scope="col" role="columnheader">Prestado</th>
                      <th scope="col" role="columnheader">Vence</th>
                      <th scope="col" role="columnheader">Estado</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {lista.items.map((prestamo) => (
                      <tr role="row" key={prestamo.id}>
                        <td role="cell" data-label="Préstamo">
                          <Link to={`/prestamos/${prestamo.id}`}>#{prestamo.id}</Link>
                        </td>
                        <td role="cell" data-label="Socio">
                          <Link to={`/socios/${prestamo.socioId}`}>#{prestamo.socioId}</Link>
                        </td>
                        <td role="cell" data-label="Libro">{prestamo.tituloLibro}</td>
                        <td role="cell" data-label="Ejemplar">{prestamo.codigoEjemplar}</td>
                        <td role="cell" data-label="Prestado">{formatearDia(prestamo.fechaPrestamo)}</td>
                        <td role="cell" data-label="Vence">{formatearDia(prestamo.fechaVencimiento)}</td>
                        <td role="cell" data-label="Estado">
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
