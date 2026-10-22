import { useCallback } from 'react'
import { Link } from 'react-router'
import { ALERTAS_PROPIAS } from '../api/alertas.ts'
import { useApi } from '../api/contexto.ts'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { EtiquetaDePrestamo } from '../componentes/EtiquetaDePrestamo.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { Velocimetro } from '../componentes/Velocimetro.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { formatearDia } from '../formato.ts'
import { zonasDeLosLibros, zonasDelPuntaje } from './zonasDelInicio.ts'

/**
 * The home of a member: how they stand (score and loans against the limit, both from the API), what needs their
 * attention and the books they have now. "Mi cuenta" keeps the detail.
 */
export function InicioPagina() {
  const api = useApi()
  const cargarYo = useCallback(() => api.cuenta.yo(), [api])
  const [yo, recargarYo] = useCargar(cargarYo)
  const cargarPrestamos = useCallback(() => api.cuenta.misPrestamos({ activo: true, size: 50 }), [api])
  const [prestamos, recargarPrestamos] = useCargar(cargarPrestamos)

  return (
    <section>
      <Titulo texto="Inicio" />
      <h1>Inicio</h1>
      <CargaVista carga={yo} reintentar={recargarYo}>
        {(usuario) => {
          const socio = usuario.socio
          if (!socio) return <p>Tu usuario no está asociado a un socio.</p>
          // The member's own alerts, plus the overdue loan that the member's data does not carry but the loans do.
          const codigos = socio.alertas.map((alerta) => alerta.code)
          if (prestamos.tipo === 'listo' && prestamos.datos.items.some((p) => p.diasRetraso > 0) && !codigos.includes('OVERDUE')) {
            codigos.push('OVERDUE')
          }
          return (
            <>
              <p className="lead">Hola, {socio.nombre}.</p>
              {codigos.length > 0 && (
                <ul className="alertas" aria-label="Alertas">
                  {codigos.map((codigo) => (
                    <li key={codigo}>{ALERTAS_PROPIAS[codigo]}</li>
                  ))}
                </ul>
              )}
              <div className="inicio-medidores">
                <Velocimetro titulo="Tu puntaje" valor={socio.score} maximo={100} zonas={zonasDelPuntaje(usuario.reglas.puntajeMinimo)} />
                <CargaVista carga={prestamos} reintentar={recargarPrestamos}>
                  {(lista) => (
                    <Velocimetro
                      titulo="Libros en préstamo"
                      valor={lista.totalElements}
                      maximo={usuario.reglas.maxPrestamosActivos}
                      zonas={zonasDeLosLibros(usuario.reglas.maxPrestamosActivos, lista.totalElements)}
                      discreto
                    />
                  )}
                </CargaVista>
              </div>
            </>
          )
        }}
      </CargaVista>

      <section aria-labelledby="titulo-tus-prestamos">
        <h2 id="titulo-tus-prestamos">Tus préstamos activos</h2>
        <CargaVista carga={prestamos} reintentar={recargarPrestamos}>
          {(lista) =>
            lista.items.length === 0 ? (
              <p>
                No tienes préstamos activos. <Link to="/libros">Mira el catálogo</Link>.
              </p>
            ) : (
              <ul className="tarjetas">
                {lista.items.map((prestamo) => (
                  <li className="tarjeta" key={prestamo.id}>
                    <span>
                      <strong>{prestamo.tituloLibro}</strong>
                      <small>
                        Ejemplar {prestamo.codigoEjemplar} · devolver el {formatearDia(prestamo.fechaVencimiento)}
                      </small>
                    </span>
                    <EtiquetaDePrestamo prestamo={prestamo} />
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
      </section>

      <p className="acciones">
        <Link to="/libros">Ver el catálogo</Link>
        <Link to="/cuenta">Ver mi cuenta</Link>
      </p>
    </section>
  )
}
