export type Tema = 'claro' | 'oscuro'

const CLAVE = 'biblioteca.tema'

const oyentes = new Set<() => void>()
let actual: Tema = recuperar()

/** The choice survives closing the browser (localStorage). Anything else, or no storage, is the light theme. */
function recuperar(): Tema {
  try {
    return localStorage.getItem(CLAVE) === 'oscuro' ? 'oscuro' : 'claro'
  } catch {
    // localStorage can be blocked: the choice then lasts only until the page is closed.
    return 'claro'
  }
}

function aplicar(tema: Tema) {
  document.documentElement.dataset.tema = tema
}

aplicar(actual)

export function obtenerTema(): Tema {
  return actual
}

export function cambiarTema(tema: Tema) {
  actual = tema
  aplicar(tema)
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Without storage the theme is applied anyway; it is just not remembered.
  }
  oyentes.forEach((oyente) => oyente())
}

export function suscribirTema(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** Tests start with the light theme and nothing stored; so does a browser that never chose. */
export function reiniciarTemaParaPruebas() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // Nothing to clean if the storage is not available.
  }
  actual = 'claro'
  aplicar(actual)
}
