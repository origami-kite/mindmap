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

      // y-durableobjects exposes its room endpoint as /rooms/:id.
      const doUrl = new URL(`/rooms/${encodeURIComponent(room)}`, request.url)
      const doRequest = new Request(doUrl, request)
      return stub.fetch(doRequest)
    }

    return env.ASSETS.fetch(request)
  }
}
