import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useApi } from '../api/contexto.ts'
import type { SocioPedido } from '../api/cliente.ts'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { NoEncontrada } from '../componentes/NoEncontrada.tsx'
import { SocioForm } from '../componentes/SocioForm.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useIdDeRuta } from '../hooks/useIdDeRuta.ts'

/** Registers a member, or edits the one in the address (/socios/:id/editar). */
export function SocioFormPagina({ edicion = false }: { edicion?: boolean }) {
  const api = useApi()
  const navegar = useNavigate()
  const id = useIdDeRuta()
  const cargar = useCallback(
    () => (edicion && id !== null ? api.socios.obtener(id) : Promise.resolve(undefined)),
    [api, edicion, id],
  )
  const [carga, recargar] = useCargar(cargar)

  if (edicion && id === null) return <NoEncontrada que="El socio" />

  async function guardar(pedido: SocioPedido) {
    const socio = edicion && id !== null ? await api.socios.actualizar(id, pedido) : await api.socios.crear(pedido)
    navegar(`/socios/${socio.id}`)
  }

  return (
    <section>
      <h1>{edicion ? 'Editar socio' : 'Nuevo socio'}</h1>
      <CargaVista carga={carga} reintentar={recargar}>
        {(socio) => (
          <SocioForm
            inicial={socio}
            textoEnviar={edicion ? 'Guardar cambios' : 'Registrar socio'}
            cancelar={edicion && id !== null ? `/socios/${id}` : '/socios'}
            alEnviar={guardar}
          />
        )}
      </CargaVista>
    </section>
  )
}
