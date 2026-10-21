import { useCallback, useState, type KeyboardEvent } from 'react'
import { useApi } from '../api/contexto.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { CargaVista } from './CargaVista.tsx'

export interface SocioElegido {
  id: number
  nombre: string
}

/** Picks a member: search by name or email, then choose one of the first results. Deactivated members cannot be chosen. */
export function SelectorSocio({
  valor,
  alElegir,
  alQuitar,
}: {
  valor: SocioElegido | null
  alElegir: (socio: SocioElegido) => void
  alQuitar: () => void
}) {
  const api = useApi()
  const [texto, setTexto] = useState('')
  const [consulta, setConsulta] = useState<string | null>(null)
  const cargar = useCallback(
    () => (consulta === null ? Promise.resolve(null) : api.socios.listar({ q: consulta || undefined, size: 5 })),
    [api, consulta],
  )
  const [carga, recargar] = useCargar(cargar)

  if (valor) {
    return (
      <div className="elegido">
        <span>
          Socio: <strong>{valor.nombre}</strong>
        </span>
        <button type="button" onClick={alQuitar}>
          Cambiar
        </button>
      </div>
    )
  }

  function alTeclear(evento: KeyboardEvent) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      buscar()
    }
  }

  function buscar() {
    setConsulta(texto.trim())
  }

  return (
    <fieldset className="selector">
      <legend>Socio</legend>
      <div className="buscador">
        <label>
          Buscar socio por nombre o correo
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear} />
        </label>
        <button type="button" onClick={buscar}>
          Buscar socio
        </button>
      </div>
      {consulta !== null && (
        <CargaVista carga={carga} reintentar={recargar}>
          {(lista) =>
            lista === null || lista.items.length === 0 ? (
              <p>Ningún socio coincide.</p>
            ) : (
              <ul className="opciones">
                {lista.items.map((socio) => (
                  <li key={socio.id}>
                    <button
                      type="button"
                      disabled={!socio.activo}
                      onClick={() => alElegir({ id: socio.id, nombre: socio.nombre })}
                    >
                      {socio.nombre} · {socio.email}
                      {!socio.activo && ' (desactivado)'}
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
      )}
    </fieldset>
  )
}
