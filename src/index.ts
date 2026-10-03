import { Hono } from 'hono'
import { YDurableObjects } from 'y-durableobjects'

export type Bindings = {
  Y_DURABLE_OBJECTS: DurableObjectNamespace<YDurableObjects<AppEnv>>
  ASSETS: Fetcher
}

export type AppEnv = {
  Bindings: Bindings
}

const app = new Hono<AppEnv>()

app.all('/sync/:room/*', async (c) => {
  const room = c.req.param('room')
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(room)) {
    return c.text('Invalid room name', 400)
  }

  const id = c.env.Y_DURABLE_OBJECTS.idFromName(room)
  const stub = c.env.Y_DURABLE_OBJECTS.get(id)

  // y-durableobjects exposes the room protocol under /rooms/:id.
  const upstream = new URL(`/rooms/${encodeURIComponent(room)}`, c.req.url)
  return stub.fetch(new Request(upstream, c.req.raw))
})

app.all('/sync/:room', async (c) => {
  const room = c.req.param('room')
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(room)) {
    return c.text('Invalid room name', 400)
  }

  const id = c.env.Y_DURABLE_OBJECTS.idFromName(room)
  const stub = c.env.Y_DURABLE_OBJECTS.get(id)
  const upstream = new URL(`/rooms/${encodeURIComponent(room)}`, c.req.url)
  return stub.fetch(new Request(upstream, c.req.raw))
})

app.get('*', c => c.env.ASSETS.fetch(c.req.raw))
app.head('*', c => c.env.ASSETS.fetch(c.req.raw))

export default app
export { YDurableObjects }
