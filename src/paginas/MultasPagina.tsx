import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import type { EstadoMulta } from '../api/cliente.ts'
import { useApi } from '../api/contexto.ts'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { Estado } from '../componentes/Estado.tsx'
import { Paginacion } from '../componentes/Paginacion.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useParametrosDeLista } from '../hooks/useParametrosDeLista.ts'
import { formatearDia, formatearSoles } from '../formato.ts'

const POR_PAGINA = 10

export function MultasPagina() {
  const api = useApi()
  const { valores, pagina, cambiar, irA } = useParametrosDeLista(['estado', 'socioId'])
  const { estado, socioId } = valores
  const socio = Number.parseInt(socioId, 10)
  const filtroEstado: EstadoMulta | undefined = estado === 'PENDING' || estado === 'PAID' ? estado : undefined

  const cargar = useCallback(
    () =>
      api.multas.listar({
        socioId: Number.isInteger(socio) && socio > 0 ? socio : undefined,
        estado: filtroEstado,
        page: pagina,
        size: POR_PAGINA,
      }),
    [api, socio, filtroEstado, pagina],
  )
  const [carga, recargar] = useCargar(cargar)
  const [errorAccion, setErrorAccion] = useState<unknown>(null)

  async function pagar(id: number) {
    if (!window.confirm('¿Registrar el pago completo de esta multa?')) return
    setErrorAccion(null)
    try {
      await api.multas.pagar(id)
      recargar()
    } catch (error) {
      setErrorAccion(error)
    }
  }

  return (
    <section>
      <Titulo texto="Multas" />
      <h1>Multas</h1>
      <div className="buscador">
        <label>
          Mostrar
          <select value={estado} onChange={(e) => cambiar({ estado: e.target.value })}>
            <option value="">Todas</option>
            <option value="PENDING">Solo pendientes</option>
            <option value="PAID">Solo pagadas</option>
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
      <p className="detalle">Una multa se paga completa y una sola vez; pagarla no devuelve puntos del puntaje.</p>

      {errorAccion !== null && <AvisoError error={errorAccion} />}
      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) =>
          lista.items.length === 0 ? (
            <p>No hay multas con esos filtros.</p>
          ) : (
            <>
              <div className="tabla-scroll">
                <table className="apilable" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Multa</th>
                      <th scope="col" role="columnheader">Préstamo</th>
                      <th scope="col" role="columnheader">Monto</th>
                      <th scope="col" role="columnheader">Días de retraso</th>
                      <th scope="col" role="columnheader">Generada</th>
                      <th scope="col" role="columnheader">Estado</th>
                      <th scope="col" role="columnheader">Acciones</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {lista.items.map((multa) => (
                      <tr role="row" key={multa.id}>
                        <td role="cell" data-label="Multa">#{multa.id}</td>
                        <td role="cell" data-label="Préstamo">
                          <Link to={`/prestamos/${multa.prestamoId}`}>#{multa.prestamoId}</Link>
                        </td>
                        <td role="cell" data-label="Monto">{formatearSoles(multa.monto)}</td>
                        <td role="cell" data-label="Días de retraso">{multa.diasRetraso}</td>
                        <td role="cell" data-label="Generada">{formatearDia(multa.fechaGeneracion)}</td>
                        <td role="cell" data-label="Estado">
                          {multa.estado === 'PENDING' ? (
                            <Estado tono="error">Pendiente</Estado>
                          ) : (
                            <Estado tono="ok">Pagada{multa.fechaPago ? ` el ${formatearDia(multa.fechaPago)}` : ''}</Estado>
                          )}
                        </td>
                        <td role="cell" data-label="Acciones" className="acciones">
                          {multa.estado === 'PENDING' && (
                            <button type="button" onClick={() => void pagar(multa.id)}>
                              Pagar
                            </button>
                          )}
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
