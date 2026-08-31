# Deploying

The app is a TanStack Start project with Nitro. It ships zero-config for
**Cloudflare Workers** (Lovable's default) and works on **Vercel** with one env var.

## Cloudflare Workers (.workers.dev)

No setup needed — Lovable publishes to Cloudflare automatically.
You can also run `bun run build` locally and `wrangler deploy` the `.output` bundle.

## Vercel

1. Import the repo into Vercel.
2. Vercel reads `vercel.json` and runs `NITRO_PRESET=vercel bun run build`.
3. Done — the upload endpoint (`/api/public/upload`) and the file proxy
   (`/<id>.<ext>`) work the same on both targets.

No database, no env secrets required.