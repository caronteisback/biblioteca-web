import { useState, type FormEvent } from 'react'

/** A search box that searches when sent, not on every key, and shows the current search. */
export function Buscador({
  valor,
  etiqueta,
  alBuscar,
}: {
  valor: string
  etiqueta: string
  alBuscar: (texto: string) => void
}) {
  const [texto, setTexto] = useState(valor)

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    alBuscar(texto.trim())
  }

  return (
    <form className="buscador" role="search" onSubmit={enviar}>
      <label>
        {etiqueta}
        <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      <button type="submit">Buscar</button>
      {valor && (
        <button
          type="button"
          onClick={() => {
            setTexto('')
            alBuscar('')
          }}
        >
          Limpiar
        </button>
      )}
    </form>
  )
}
