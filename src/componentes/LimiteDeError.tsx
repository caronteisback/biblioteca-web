import { Component, type ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * Catches a screen that fails while drawing, so the whole page does not go blank. The layout keys it by
 * address, so moving to another screen draws it again.
 */
export class LimiteDeError extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Fallo al dibujar la pantalla', error)
  }

  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <div role="alert" className="aviso aviso-error">
        <p>Algo salió mal al mostrar esta pantalla.</p>
        <p>
          <Link to="/libros">Volver a los libros</Link>
        </p>
      </div>
    )
  }
}
