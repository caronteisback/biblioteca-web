import { useSearchParams } from 'react-router'

/**
 * The filters and the page of a list, kept in the address (?estado=PENDING&page=2) so reload and "back" keep them.
 * `claves` are the filters of the screen; changing one goes back to the first page, and empty filters are left out.
 */
export function useParametrosDeLista<K extends string>(claves: readonly K[]) {
  const [params, setParams] = useSearchParams()
  const valores = Object.fromEntries(claves.map((clave) => [clave, params.get(clave) ?? ''])) as Record<K, string>
  const pedida = Number.parseInt(params.get('page') ?? '0', 10)
  const pagina = Number.isInteger(pedida) && pedida > 0 ? pedida : 0

  function ir(cambios: Partial<Record<K, string>>, nuevaPagina: number) {
    const siguiente = new URLSearchParams()
    for (const clave of claves) {
      const valor = cambios[clave] ?? valores[clave]
      if (valor) siguiente.set(clave, valor)
    }
    if (nuevaPagina > 0) siguiente.set('page', String(nuevaPagina))
    setParams(siguiente)
  }

  return {
    valores,
    pagina,
    cambiar: (cambios: Partial<Record<K, string>>) => ir(cambios, 0),
    irA: (nueva: number) => ir({}, nueva),
  }
}
