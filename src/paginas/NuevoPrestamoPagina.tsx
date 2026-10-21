import { useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { SelectorEjemplar, type EjemplarElegido } from '../componentes/SelectorEjemplar.tsx'
import { SelectorSocio, type SocioElegido } from '../componentes/SelectorSocio.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useCargar } from '../hooks/useCargar.ts'

function numeroPositivo(texto: string | null): number | null {
  const numero = Number(texto)
  return texto !== null && Number.isInteger(numero) && numero > 0 ? numero : null
}

/**
 * Lends a copy to a member. It can open with one of them already chosen (?socioId=5 from a member,
 * ?ejemplarId=9 from a copy), and asks only for what is missing.
 */
export function NuevoPrestamoPagina() {
  const api = useApi()
  const [params] = useSearchParams()
  const socioId = numeroPositivo(params.get('socioId'))
  const ejemplarId = numeroPositivo(params.get('ejemplarId'))

  const cargar = useCallback(async () => {
    const socio = socioId === null ? null : await api.socios.obtener(socioId)
    let ejemplar: EjemplarElegido | null = null
    if (ejemplarId !== null) {
      const copia = await api.ejemplares.obtener(ejemplarId)
      const libro = await api.libros.obtener(copia.libroId)
      ejemplar = { id: copia.id, codigo: copia.codigo, titulo: libro.titulo }
    }
    return {
      socio: socio && socio.activo ? { id: socio.id, nombre: socio.nombre } : null,
      ejemplar,
    }
  }, [api, socioId, ejemplarId])
  const [carga, recargar] = useCargar(cargar)

  return (
    <section>
      <Titulo texto="Nuevo préstamo" />
      <h1>Nuevo préstamo</h1>
      <CargaVista carga={carga} reintentar={recargar}>
        {(inicial) => <FormularioDePrestamo socioInicial={inicial.socio} ejemplarInicial={inicial.ejemplar} />}
      </CargaVista>
    </section>
  )
}

function FormularioDePrestamo({
  socioInicial,
  ejemplarInicial,
}: {
  socioInicial: SocioElegido | null
  ejemplarInicial: EjemplarElegido | null
}) {
  const api = useApi()
  const navegar = useNavigate()
  const [socio, setSocio] = useState(socioInicial)
  const [ejemplar, setEjemplar] = useState(ejemplarInicial)
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  async function prestar() {
    if (socio === null || ejemplar === null) return
    setError(null)
    setEnviando(true)
    try {
      const prestamo = await api.prestamos.crear(socio.id, ejemplar.id)
      navegar(`/prestamos/${prestamo.id}`)
    } catch (fallo) {
      setError(fallo)
      setEnviando(false)
    }
  }

  return (
    <div className="formulario">
      <SelectorSocio valor={socio} alElegir={setSocio} alQuitar={() => setSocio(null)} />
      <SelectorEjemplar valor={ejemplar} alElegir={setEjemplar} alQuitar={() => setEjemplar(null)} />
      <p className="detalle">La fecha de préstamo es hoy y el vencimiento lo fija la API; no se eligen aquí.</p>
      {error !== null && <AvisoError error={error} />}
      <div className="acciones">
        <button type="button" className="principal" disabled={enviando || socio === null || ejemplar === null} onClick={() => void prestar()}>
          {enviando ? 'Prestando…' : 'Prestar'}
        </button>
        <Link to="/prestamos">Cancelar</Link>
      </div>
    </div>
  )
}
