import type { ReactNode } from 'react'

export interface Barra {
  clave: string | number
  etiqueta: ReactNode
  valor: number
}

/**
 * A list of horizontal bars. Every row is real text (the label and the number), so a screen reader reads the chart
 * as a list; the bar is only a picture of the number and is hidden from it. The longest bar fills the row.
 */
export function Barras({ barras, nombre }: { barras: readonly Barra[]; nombre: string }) {
  const maximo = Math.max(1, ...barras.map((barra) => barra.valor))
  return (
    <ol className="barras" aria-label={nombre}>
      {barras.map((barra) => (
        <li key={barra.clave}>
          <span className="barra-etiqueta">{barra.etiqueta}</span>
          <svg className="barra" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <rect className="barra-pista" width="100" height="8" rx="2" />
            <rect className="barra-valor" width={(barra.valor / maximo) * 100} height="8" rx="2" />
          </svg>
          <strong>{barra.valor}</strong>
        </li>
      ))}
    </ol>
  )
}
