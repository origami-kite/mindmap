import * as Y from 'yjs'
import { YDurableObjects } from 'y-durableobjects'

export { YDurableObjects }

type Bindings = {
  Y_DURABLE_OBJECTS: DurableObjectNamespace<YDurableObjects<AppEnv>>
  ASSETS: Fetcher
}

type AppEnv = {
  Bindings: Bindings
}

function isValidRoom(room: string): boolean {
  return /^[A-Za-z0-9_-]{1,80}$/.test(room)
}

function createDefaultDocUpdate(): Uint8Array {
  const doc = new Y.Doc()
  const nodes = doc.getMap('nodes')

  const makeNode = (id: string, text: string) => ({
    id,
    text,
    color: null,
    img: null,
    collapsed: false,
    childrenIds: [] as string[],
  })

  const root = makeNode('root', '中心主题')
  const c1 = makeNode('seed-child-1', '喵一')
  const c2 = makeNode('seed-child-2', '喵二')
  const c3 = makeNode('seed-child-3', '喵三')
  root.childrenIds = [c1.id, c2.id, c3.id]

  doc.transact(() => {
    nodes.set(root.id, root)
    nodes.set(c1.id, c1)
    nodes.set(c2.id, c2)
    nodes.set(c3.id, c3)
  })

  return Y.encodeStateAsUpdate(doc)
}

async function ensureRoomSeeded(stub: YDurableObjects<any>): Promise<void> {
  // The server owns room initialization. This prevents a newly joined browser
  // from creating a competing local default document before the remote state arrives.
  const existing = await stub.getYDoc()
  const probe = new Y.Doc()
  Y.applyUpdate(probe, existing)

  if (probe.getMap('nodes').size > 0) return

  await stub.updateYDoc(createDefaultDocUpdate())
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/sync/')) {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('WebSocket endpoint', { status: 426 })
      }

      const room = decodeURIComponent(url.pathname.slice('/sync/'.length))
      if (!isValidRoom(room)) {
        return new Response('Invalid room name', { status: 400 })
      }

      const id = env.Y_DURABLE_OBJECTS.idFromName(room)
      const stub = env.Y_DURABLE_OBJECTS.get(id)

      await ensureRoomSeeded(stub)

      // y-durableobjects exposes its room endpoint as /rooms/:id.
      const doUrl = new URL(`/rooms/${encodeURIComponent(room)}`, request.url)
      const doRequest = new Request(doUrl, request)
      return stub.fetch(doRequest)
    }

    return env.ASSETS.fetch(request)
  }
}
