import { useSearchParams } from 'react-router'

/** The search text and page of a list, kept in the address (?q=faro&page=2) so reload and "back" keep them. */
export function useBusqueda() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const pedida = Number.parseInt(params.get('page') ?? '0', 10)
  const pagina = Number.isInteger(pedida) && pedida > 0 ? pedida : 0

  function ir(nuevoQ: string, nuevaPagina: number) {
    const siguiente = new URLSearchParams()
    if (nuevoQ) siguiente.set('q', nuevoQ)
    if (nuevaPagina > 0) siguiente.set('page', String(nuevaPagina))
    setParams(siguiente)
  }

  return {
    q,
    pagina,
    buscar: (texto: string) => ir(texto, 0),
    irA: (nueva: number) => ir(q, nueva),
  }
}
