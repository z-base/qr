import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const host = '127.0.0.1'
const port = 4173
const root = normalize(process.cwd())

const mimeByExtension = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${host}:${port}`)
    const requestedPath =
      url.pathname === '/' ? '/test/e2e/index.html' : url.pathname
    const safePath = normalize(join(root, requestedPath))

    if (!safePath.startsWith(root)) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }

    const body = await readFile(safePath)
    const contentType =
      mimeByExtension[extname(safePath).toLowerCase()] ??
      'application/octet-stream'

    res.statusCode = 200
    res.setHeader('content-type', contentType)
    res.end(body)
  } catch {
    res.statusCode = 404
    res.end('Not Found')
  }
})

server.listen(port, host, () => {
  process.stdout.write(`e2e server listening on http://${host}:${port}\n`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
