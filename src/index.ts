import * as Y from 'yjs'
import { YDurableObjects as BaseYDurableObjects } from 'y-durableobjects'
import type { Env } from 'hono'

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
  const meta = doc.getMap('mindmap_meta')
  const nodes = doc.getMap('mindmap_nodes')

  const put = (id: string, text: string, parentId: string | null, order: number) => {
    const node = new Y.Map<unknown>()
    node.set('id', id)
    node.set('text', text)
    node.set('color', null)
    node.set('img', null)
    node.set('collapsed', false)
    node.set('parentId', parentId)
    node.set('order', order)
    nodes.set(id, node)
  }

  put('root', '中心主题', null, 0)
  put('seed-child-1', '喵一', 'root', 0)
  put('seed-child-2', '喵二', 'root', 1)
  put('seed-child-3', '喵三', 'root', 2)
  meta.set('schema', 2)
  meta.set('rootId', 'root')

  return Y.encodeStateAsUpdate(doc)
}

/**
 * Keep the public class name YDurableObjects so the existing Cloudflare
 * binding stays compatible, but add a safe server-side initializer.
 *
 * Important: y-durableobjects' public updateYDoc() expects a websocket
 * protocol message, not a raw Yjs update. We therefore apply the raw update
 * directly to the protected WSSharedDoc here.
 */
export class YDurableObjects<T extends Env = AppEnv> extends BaseYDurableObjects<T> {
  async ensureSeeded(): Promise<void> {
    const probe = new Y.Doc()
    Y.applyUpdate(probe, Y.encodeStateAsUpdate(this.doc))

    const v2 = probe.getMap('mindmap_nodes')
    const legacy = probe.getMap('nodes')
    const meta = probe.getMap('mindmap_meta')

    // Existing V2 data: never overwrite it.
    if (v2.size > 0 || meta.get('schema') === 2) return

    // Existing legacy room: let the first synchronized client migrate it.
    if (legacy.size > 0) return

    // Truly empty room: create the initial document on the server.
    Y.applyUpdate(this.doc, createDefaultDocUpdate())
    await this.cleanup()
  }
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

      // Serialize initialization through the Durable Object. This is safe to
      // call for every connection because ensureSeeded() is idempotent.
      await stub.ensureSeeded()

      // y-durableobjects exposes its websocket room endpoint as /rooms/:id.
      const doUrl = new URL(`/rooms/${encodeURIComponent(room)}`, request.url)
      const doRequest = new Request(doUrl, request)
      return stub.fetch(doRequest)
    }

    return env.ASSETS.fetch(request)
  }
}
