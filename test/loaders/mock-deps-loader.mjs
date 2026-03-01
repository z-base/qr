import { resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = resolvePath(fileURLToPath(new URL('../..', import.meta.url)))
const qrStubUrl = pathToFileURL(resolvePath(rootDir, 'test/stubs/qr.mjs')).href
const scannerStubUrl = pathToFileURL(
  resolvePath(rootDir, 'test/stubs/qr-scanner.mjs')
).href

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'qr') return { shortCircuit: true, url: qrStubUrl }
  if (specifier === 'qr-scanner')
    return { shortCircuit: true, url: scannerStubUrl }

  return nextResolve(specifier, context)
}
