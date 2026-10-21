import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useApi } from '../api/contexto.ts'
import type { LibroPedido } from '../api/cliente.ts'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { LibroForm } from '../componentes/LibroForm.tsx'
import { NoEncontrada } from '../componentes/NoEncontrada.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useIdDeRuta } from '../hooks/useIdDeRuta.ts'

/** Creates a book, or edits the one in the address (/libros/:id/editar). */
export function LibroFormPagina({ edicion = false }: { edicion?: boolean }) {
  const api = useApi()
  const navegar = useNavigate()
  const id = useIdDeRuta()
  const cargar = useCallback(
    () => (edicion && id !== null ? api.libros.obtener(id) : Promise.resolve(undefined)),
    [api, edicion, id],
  )
  const [carga, recargar] = useCargar(cargar)

  if (edicion && id === null) return <NoEncontrada que="El libro" />

  async function guardar(pedido: LibroPedido) {
    const libro = edicion && id !== null ? await api.libros.actualizar(id, pedido) : await api.libros.crear(pedido)
    navegar(`/libros/${libro.id}`)
  }

  return (
    <section>
      <h1>{edicion ? 'Editar libro' : 'Nuevo libro'}</h1>
      <CargaVista carga={carga} reintentar={recargar}>
        {(libro) => (
          <LibroForm
            inicial={libro}
            textoEnviar={edicion ? 'Guardar cambios' : 'Crear libro'}
            cancelar={edicion && id !== null ? `/libros/${id}` : '/libros'}
            alEnviar={guardar}
          />
        )}
      </CargaVista>
    </section>
  )
}
