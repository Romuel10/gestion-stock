import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const host = '127.0.0.1'
const port = 4173

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
}

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.(\/|\\|$))+/, '')
  let file = join(root, safe === '/' ? 'index.html' : safe)
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = join(file, 'index.html')
    return file
  } catch {
    return join(root, 'index.html')
  }
}

createServer(async (req, res) => {
  try {
    const file = await resolveFile(req.url ?? '/')
    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600'
    })
    res.end(body)
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('OrphéNutri : impossible de démarrer le serveur local.')
  }
}).listen(port, host, () => {
  console.log(`OrphéNutri Local est disponible sur http://${host}:${port}`)
  console.log('Fermez cette fenêtre pour arrêter le logiciel.')
})
