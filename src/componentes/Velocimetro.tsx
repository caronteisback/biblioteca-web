import { Estado } from './Estado.tsx'
import { zonaDe, type Zona } from './zonas.ts'

const CENTRO = 100
const RADIO = 78

function punto(fraccion: number, radio: number): [number, number] {
  const angulo = Math.PI * (1 - fraccion)
  return [CENTRO + radio * Math.cos(angulo), CENTRO - radio * Math.sin(angulo)]
}

function arco(desde: number, hasta: number): string {
  const [x1, y1] = punto(desde, RADIO)
  const [x2, y2] = punto(hasta, RADIO)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${RADIO} ${RADIO} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

interface Props {
  titulo: string
  valor: number
  maximo: number
  zonas: readonly Zona[]
  /** For counts (0, 1, 2…): each whole number is a slot of the scale, so the needle points at the middle of its slot and every zone has a width. */
  discreto?: boolean
  /** What to say next to the number; by default the label of the zone. */
  leyenda?: string
}

/**
 * A half-circle gauge. The drawing is decoration: the title, the number and the zone's words, which are real text,
 * say everything, and the zone is never told by colour alone (the label comes with an icon).
 */
export function Velocimetro({ titulo, valor, maximo, zonas, discreto = false, leyenda }: Props) {
  const escala = discreto ? maximo + 1 : maximo
  const acotado = Math.min(Math.max(valor, 0), maximo)
  const posicion = (discreto ? acotado + 0.5 : acotado) / escala
  const zona = zonaDe(zonas, valor)
  const [ax, ay] = punto(posicion, RADIO - 16)
  return (
    <figure className="velocimetro">
      <figcaption>{titulo}</figcaption>
      <svg viewBox="0 0 200 112" aria-hidden="true" focusable="false">
        {zonas.map((z, i) => {
          const hasta = i + 1 < zonas.length ? zonas[i + 1].desde : escala
          return <path key={z.desde} className={`zona zona-${z.tono}`} d={arco(z.desde / escala, hasta / escala)} />
        })}
        <line x1={CENTRO} y1={CENTRO} x2={ax.toFixed(1)} y2={ay.toFixed(1)} className="aguja" />
        <circle cx={CENTRO} cy={CENTRO} r="6" className="eje" />
      </svg>
      <p className="velocimetro-valor">
        <strong>{valor}</strong> de {maximo}
      </p>
      <Estado tono={zona.tono}>{leyenda ?? zona.etiqueta}</Estado>
    </figure>
  )
}
