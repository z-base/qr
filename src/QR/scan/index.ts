import QrScanner from 'qr-scanner'
import { QRError } from '../../.errors/class.js'

/**
 * Displays a modal dialog that streams the device camera and scans for a QR code.
 *
 * The dialog closes once a QR code is decoded and the decoded payload is returned.
 *
 * @returns A promise that fulfills with the decoded QR code string.
 * @throws {QRError} If no camera is available.
 */
export async function scan(): Promise<string | false> {
  if (!(await QrScanner.hasCamera()))
    throw new QRError(
      'NO_CAMERA_AVAILABLE',
      'QR-Code Scanning requires a camera'
    )

  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = '#fff'
  dialog.style.borderRadius = '1rem'
  dialog.style.outline = 'none'
  dialog.style.width = 'min(80vw, 400px)'
  dialog.style.aspectRatio = '1 / 1'
  dialog.style.overflow = 'hidden'

  const video = document.createElement('video')
  video.setAttribute('playsinline', 'true')
  video.muted = true
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.display = 'block'
  video.style.objectFit = 'cover'
  video.style.aspectRatio = '1 / 1'

  dialog.append(video)
  document.body.append(dialog)
  dialog.showModal()

  return new Promise<string>((resolve, reject) => {
    const ac = new AbortController()
    let settled = false

    const cleanup = (): void => {
      if (settled) return
      settled = true

      ac.abort()
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)

      try {
        scanner.stop()
      } catch {}
      try {
        scanner.destroy()
      } catch {}

      try {
        dialog.remove()
      } catch {}
    }

    const abort = (): void => {
      if (settled) return
      settled = true

      ac.abort()
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)

      try {
        scanner.stop()
      } catch {}
      try {
        scanner.destroy()
      } catch {}

      try {
        dialog.remove()
      } catch {}

      reject(false)
    }

    const onPointerUp = (): void => abort()
    const onKeyDown = (): void => abort()

    setTimeout(() => {
      window.addEventListener('pointerup', onPointerUp, { signal: ac.signal })
      window.addEventListener('keydown', onKeyDown, { signal: ac.signal })
      dialog.addEventListener(
        'cancel',
        (e) => {
          e.preventDefault()
          abort()
        },
        { signal: ac.signal }
      )
      dialog.addEventListener('close', abort, { signal: ac.signal })
    }, 500)

    const scanner = new QrScanner(
      video,
      (result: QrScanner.ScanResult) => {
        if (settled) return
        settled = true
        ac.abort()
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('keydown', onKeyDown)
        try {
          scanner.stop()
        } catch {}
        try {
          scanner.destroy()
        } catch {}
        try {
          dialog.remove()
        } catch {}
        resolve(result.data)
      },
      {
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: () => {},
      }
    )

    scanner.start().catch((err: unknown) => {
      if (settled) return
      settled = true
      ac.abort()
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      try {
        scanner.stop()
      } catch {}
      try {
        scanner.destroy()
      } catch {}
      try {
        dialog.remove()
      } catch {}
      reject(err)
    })
  })
}
