import { useParametrosDeLista } from './useParametrosDeLista.ts'

/** The search text and page of a list, kept in the address (?q=faro&page=2). */
export function useBusqueda() {
  const { valores, pagina, cambiar, irA } = useParametrosDeLista(['q'])
  return { q: valores.q, pagina, buscar: (texto: string) => cambiar({ q: texto }), irA }
}
