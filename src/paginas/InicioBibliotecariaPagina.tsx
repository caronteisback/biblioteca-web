import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { Barras } from '../componentes/Barras.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { Cifra } from '../componentes/Cifra.tsx'
import { Estado } from '../componentes/Estado.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { formatearDia, formatearSemana, formatearSoles } from '../formato.ts'

/**
 * The home of a librarian: the figures that say what needs doing today (overdue and soon-to-be-due loans, pending
 * fines), how the lending has gone lately and which loans to chase first. The API works everything out; this screen
 * only draws it, and each figure leads to the list it counts.
 */
export function InicioBibliotecariaPagina() {
  const api = useApi()
  const cargar = useCallback(() => api.panel.resumen(), [api])
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <Titulo texto="Inicio" />
      <h1>Inicio</h1>
      <CargaVista carga={carga} reintentar={recargar}>
        {(panel) => {
          const { prestamos, multas } = panel
          return (
            <>
              <p className="lead">La biblioteca al {formatearDia(panel.fecha)}.</p>
              <div className="cifras">
                <Cifra
                  titulo="Préstamos activos"
                  valor={prestamos.activos}
                  nota={`de ${panel.ejemplaresActivos} ejemplares`}
                  enlace="/prestamos?estado=activos"
                />
                <Cifra
                  titulo="Vencidos"
                  valor={prestamos.vencidos}
                  nota="Pasaron su fecha de devolución"
                  enlace="/prestamos?estado=activos"
                  estado={prestamos.vencidos > 0 ? { tono: 'error', texto: 'Atender' } : { tono: 'ok', texto: 'Al día' }}
                />
                <Cifra
                  titulo={`Vencen en ${prestamos.diasPorVencer} días`}
                  valor={prestamos.porVencer}
                  nota="Todavía en plazo"
                  enlace="/prestamos?estado=activos"
                  estado={prestamos.porVencer > 0 ? { tono: 'aviso', texto: 'Avisar' } : { tono: 'ok', texto: 'Sin pendientes' }}
                />
                <Cifra
                  titulo="Multas pendientes"
                  valor={multas.pendientes}
                  nota={`${formatearSoles(multas.montoPendiente)} · ${multas.sociosConMultaPendiente} ${multas.sociosConMultaPendiente === 1 ? 'socio' : 'socios'}`}
                  enlace="/multas?estado=PENDING"
                  estado={multas.pendientes > 0 ? { tono: 'error', texto: 'Cobrar' } : { tono: 'ok', texto: 'Sin deudas' }}
                />
              </div>

              <div className="paneles">
                <section aria-labelledby="titulo-semanas">
                  <h2 id="titulo-semanas">Préstamos por semana</h2>
                  <p className="detalle">Préstamos iniciados cada semana, contada desde el lunes.</p>
                  <Barras
                    nombre="Préstamos por semana"
                    barras={panel.prestamosPorSemana.map((semana) => ({
                      clave: semana.semana,
                      etiqueta: `Desde el ${formatearSemana(semana.semana)}`,
                      valor: semana.prestamos,
                    }))}
                  />
                </section>
                <section aria-labelledby="titulo-ranking">
                  <h2 id="titulo-ranking">Libros más prestados</h2>
                  <p className="detalle">En los últimos 90 días.</p>
                  {panel.masPrestados.length === 0 ? (
                    <p>Todavía no hay préstamos que contar.</p>
                  ) : (
                    <Barras
                      nombre="Libros más prestados"
                      barras={panel.masPrestados.map((libro) => ({
                        clave: libro.libroId,
                        etiqueta: <Link to={`/libros/${libro.libroId}`}>{libro.titulo}</Link>,
                        valor: libro.prestamos,
                      }))}
                    />
                  )}
                </section>
              </div>

              <section aria-labelledby="titulo-atencion">
                <h2 id="titulo-atencion">Requieren atención</h2>
                {panel.requierenAtencion.length === 0 ? (
                  <p>Nada urgente: no hay préstamos vencidos ni por vencer.</p>
                ) : (
                  <ul className="tarjetas">
                    {panel.requierenAtencion.map((caso) => (
                      <li className="tarjeta" key={caso.prestamoId}>
                        <span>
                          <strong>
                            <Link to={`/socios/${caso.socioId}`}>{caso.nombreSocio}</Link>
                          </strong>
                          <small>
                            {caso.tituloLibro} · ejemplar {caso.codigoEjemplar} · {caso.alerta === 'OVERDUE' ? 'venció' : 'vence'} el{' '}
                            {formatearDia(caso.fechaVencimiento)}
                          </small>
                        </span>
                        <span className="acciones">
                          {caso.alerta === 'OVERDUE' ? (
                            <Estado tono="error">Vencido ({caso.diasRetraso} d)</Estado>
                          ) : (
                            <Estado tono="aviso">Vence pronto</Estado>
                          )}
                          <Link to={`/prestamos/${caso.prestamoId}`}>Ver préstamo #{caso.prestamoId}</Link>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )
        }}
      </CargaVista>
    </section>
  )
}
