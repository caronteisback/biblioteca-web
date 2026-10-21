import { useParams } from 'react-router'

/** The `:id` of the route as a number, or null when it is not a positive whole number. */
export function useIdDeRuta(): number | null {
  const { id } = useParams()
  const numero = Number(id)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}
