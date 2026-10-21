import { Link } from 'react-router'

export function NoEncontrada({ que = 'La página' }: { que?: string }) {
  return (
    <section>
      <h1>No encontrado</h1>
      <p>{que} que buscas no existe.</p>
      <p>
        <Link to="/libros">Volver a los libros</Link>
      </p>
    </section>
  )
}
