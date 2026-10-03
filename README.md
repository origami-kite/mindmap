# Mindmap Collaborative (Cloudflare + Yjs + Durable Objects)

This version uses:
- Cloudflare Workers for the HTTP/static layer
- Durable Objects + `y-durableobjects` for the Yjs WebSocket room
- `Y.Map` per node and `Y.Array` for each node's child list

Important: the browser no longer uses IndexedDB for room state. Default room initialization happens only after the initial Yjs sync, and deterministic IDs prevent duplicate seed trees.

## Cloudflare Workers Builds
- Root directory: empty (when this repository is the project root)
- Build command: empty
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

## Local
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run deploy
```
