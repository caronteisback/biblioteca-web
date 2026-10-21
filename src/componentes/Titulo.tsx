import { useEffect } from 'react'

/** Sets the title of the browser tab for the screen that shows it: it is what a screen reader announces on arrival. */
export function Titulo({ texto }: { texto: string }) {
  useEffect(() => {
    document.title = `${texto} · Biblioteca`
  }, [texto])
  return null
}
