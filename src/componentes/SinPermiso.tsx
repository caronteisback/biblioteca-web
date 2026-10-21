import { Link } from 'react-router'
import { useSesion } from '../sesion/useSesion.ts'
import { inicioDe } from '../sesion/inicio.ts'
import { Titulo } from './Titulo.tsx'

export function SinPermiso() {
  const { rol } = useSesion()
  return (
    <section>
      <Titulo texto="Sin permiso" />
      <h1>Sin permiso</h1>
      <p>Tu rol no permite ver esta pantalla.</p>
      <p>
        <Link to={inicioDe(rol)}>Ir a mi inicio</Link>
      </p>
    </section>
  )
}
