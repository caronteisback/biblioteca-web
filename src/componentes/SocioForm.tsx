import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Socio, SocioPedido } from '../api/cliente.ts'
import { AvisoError } from './AvisoError.tsx'

/** Form of a member: name and email. The API stays the authority on what is valid. */
export function SocioForm({
  inicial,
  textoEnviar,
  cancelar,
  alEnviar,
}: {
  inicial?: Socio
  textoEnviar: string
  cancelar: string
  alEnviar: (socio: SocioPedido) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await alEnviar({ nombre: nombre.trim(), email: email.trim() })
    } catch (fallo) {
      setError(fallo)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} />
      </label>
      <label>
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} />
      </label>
      {error !== null && <AvisoError error={error} />}
      <div className="acciones">
        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : textoEnviar}
        </button>
        <Link to={cancelar}>Cancelar</Link>
      </div>
    </form>
  )
}
