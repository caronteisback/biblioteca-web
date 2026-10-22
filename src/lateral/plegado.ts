const CLAVE = 'biblioteca.lateral'

/** Whether the person left the side menu folded to its icons on a wide screen. Not folded unless it was chosen. */
export function leerPlegado(): boolean {
  try {
    return localStorage.getItem(CLAVE) === 'plegado'
  } catch {
    // localStorage can be blocked: the menu then starts open every time.
    return false
  }
}

export function guardarPlegado(plegado: boolean) {
  try {
    if (plegado) localStorage.setItem(CLAVE, 'plegado')
    else localStorage.removeItem(CLAVE)
  } catch {
    // Without storage the choice lasts until the page is closed.
  }
}
