/** Previous and next buttons for a list that answers in pages numbered from 0. */
export function Paginacion({
  pagina,
  totalPaginas,
  totalElementos,
  alCambiar,
}: {
  pagina: number
  totalPaginas: number
  totalElementos: number
  alCambiar: (pagina: number) => void
}) {
  if (totalPaginas <= 1) {
    return <p className="total">{totalElementos} en total</p>
  }
  return (
    <nav className="paginacion" aria-label="Páginas">
      <button type="button" disabled={pagina <= 0} onClick={() => alCambiar(pagina - 1)}>
        Anterior
      </button>
      <span>
        Página {pagina + 1} de {totalPaginas} · {totalElementos} en total
      </span>
      <button type="button" disabled={pagina >= totalPaginas - 1} onClick={() => alCambiar(pagina + 1)}>
        Siguiente
      </button>
    </nav>
  )
}
