import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { iniciarSesion } from '../sesion/estado.ts'
import { destinoTrasEntrar } from '../sesion/inicio.ts'
import { useSesion } from '../sesion/useSesion.ts'

/** Where the user was going before being sent here, if it is an address inside the panel. */
function destinoPedido(estado: unknown): string | null {
  const desde = (estado as { desde?: unknown } | null)?.desde
  return typeof desde === 'string' && desde.startsWith('/') && !desde.startsWith('//') && desde !== '/login' ? desde : null
}

export function LoginPagina() {
  const api = useApi()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { sesion, rol, aviso } = useSesion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion && rol) {
    return <Navigate to={destinoTrasEntrar(rol, destinoPedido(ubicacion.state))} replace />
  }

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const respuesta = await api.auth.entrar(email.trim(), password)
      iniciarSesion({ token: respuesta.token, expiraEn: respuesta.expiraEn, usuario: respuesta.usuario })
      navegar(destinoTrasEntrar(respuesta.usuario.rol, destinoPedido(ubicacion.state)), { replace: true })
    } catch (fallo) {
      setError(fallo)
      setPassword('')
      setEnviando(false)
    }
  }

  return (
    <main className="acceso">
      <Titulo texto="Entrar" />
      <h1>Biblioteca</h1>
      <p className="lead">Entra con tu correo y tu contraseña.</p>
      {aviso && error === null && (
        <p role="status" className="aviso aviso-aviso">
          {aviso}
        </p>
      )}
      <form className="formulario" onSubmit={entrar}>
        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" maxLength={150} />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" maxLength={128} />
        </label>
        {error !== null && <AvisoError error={error} />}
        <div className="acciones">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </main>
  )
}
