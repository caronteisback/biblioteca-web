import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Libro, LibroPedido } from '../api/cliente.ts'
import { AvisoError } from './AvisoError.tsx'

/** Form of a book. The limits mirror the API's own; the API stays the authority and its answer is shown. */
export function LibroForm({
  inicial,
  textoEnviar,
  cancelar,
  alEnviar,
}: {
  inicial?: Libro
  textoEnviar: string
  cancelar: string
  alEnviar: (libro: LibroPedido) => Promise<void>
}) {
  const [isbn, setIsbn] = useState(inicial?.isbn ?? '')
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [autor, setAutor] = useState(inicial?.autor ?? '')
  const [anio, setAnio] = useState(inicial?.anioPublicacion?.toString() ?? '')
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await alEnviar({
        isbn: isbn.trim(),
        titulo: titulo.trim(),
        autor: autor.trim(),
        anioPublicacion: anio.trim() === '' ? undefined : Number(anio),
      })
    } catch (fallo) {
      setError(fallo)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        ISBN
        <input value={isbn} onChange={(e) => setIsbn(e.target.value)} required maxLength={20} />
        <small>10 o 13 dígitos; se admiten guiones y espacios.</small>
      </label>
      <label>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={200} />
      </label>
      <label>
        Autor
        <input value={autor} onChange={(e) => setAutor(e.target.value)} required maxLength={150} />
      </label>
      <label>
        Año de publicación (opcional)
        <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} min={1000} max={2100} />
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
