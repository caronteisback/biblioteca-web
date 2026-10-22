import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Estado, type Tono } from './Estado.tsx'

interface Props {
  titulo: string
  valor: number
  nota?: ReactNode
  /** Where the figure leads: a card is a link to the list it counts. */
  enlace: string
  /** How the figure is doing, told in words with an icon as well as in colour. */
  estado?: { tono: Tono; texto: string }
}

/** One figure of the dashboard: a title, a big number, a note and, when it helps, how it is doing. */
export function Cifra({ titulo, valor, nota, enlace, estado }: Props) {
  return (
    <Link className="cifra" to={enlace}>
      <span className="cifra-titulo">{titulo}</span>
      <strong className="cifra-valor">{valor}</strong>
      {nota && <span className="cifra-nota">{nota}</span>}
      {estado && <Estado tono={estado.tono}>{estado.texto}</Estado>}
    </Link>
  )
}
