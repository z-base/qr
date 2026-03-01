import QrScanner from 'qr-scanner'

/**
 * Displays a modal dialog that streams the device camera and scans for a QR code.
 *
 * The dialog closes automatically once a QR code is decoded and the decoded payload is returned.
 *
 * @returns A promise that fulfills with the decoded QR code content.
 * @throws {Error} If no camera is available.
 */
export async function scan(): Promise<string> {
  if (!(await QrScanner.hasCamera())) throw new Error('No camera available')

  const dialog = document.createElement('dialog')
  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = '#fff'
  dialog.style.borderRadius = '1rem'
  dialog.style.display = 'flex'
  dialog.style.alignItems = 'center'
  dialog.style.justifyContent = 'center'
  dialog.style.position = 'relative'

  const video = document.createElement('video')
  video.setAttribute('playsinline', 'true')
  video.muted = true
  video.style.width = 'min(90vw, 420px)'
  video.style.height = 'auto'
  video.style.aspectRatio = '1 / 1'
  video.style.display = 'block'
  video.style.borderRadius = '1rem'

  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = '×'
  close.setAttribute('aria-label', 'Close')
  close.style.position = 'absolute'
  close.style.top = '0.25rem'
  close.style.right = '0.5rem'
  close.style.fontSize = '2rem'
  close.style.lineHeight = '1'
  close.style.border = 'none'
  close.style.background = 'transparent'
  close.style.cursor = 'pointer'

  dialog.append(video, close)
  document.body.append(dialog)
  dialog.showModal()

  return new Promise<string>((resolve, reject) => {
    let settled = false

    const scanner = new QrScanner(
      video,
      (result: QrScanner.ScanResult) => {
        if (settled) return
        settled = true
        cleanup()
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

    const cleanup = () => {
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

    const abort = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new DOMException('The scan was aborted.', 'AbortError'))
    }

    close.onclick = () => dialog.close()

    dialog.addEventListener('cancel', (e) => {
      e.preventDefault()
      dialog.close()
    })

    dialog.addEventListener('close', abort, { once: true })

    scanner.start().catch((err: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    })
  })
}
