/** A stretch of the scale of a gauge: it starts at `desde`, ends where the next one starts (or at the end of the scale) and means `tono`. */
export interface Zona {
  desde: number
  tono: 'ok' | 'aviso' | 'error'
  etiqueta: string
}

/** The zone a value falls in: the last one that has already started. */
export function zonaDe(zonas: readonly Zona[], valor: number): Zona {
  return [...zonas].reverse().find((zona) => valor >= zona.desde) ?? zonas[0]
}
