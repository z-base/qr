import QrScanner from 'qr-scanner'
import { QRError } from '../../.errors/class.js'
import { getErrorMessage } from '../../.helpers/index.js'

/**
 * Displays a modal dialog that streams the device camera and scans for a QR code.
 *
 * The dialog closes once a QR code is decoded and the decoded payload is returned.
 *
 * @returns A promise that fulfills with the decoded QR code string.
 * @throws {QRError} If camera availability cannot be checked, no camera is available, the scan is cancelled, or scanner startup fails.
 */
export async function scan(): Promise<string> {
  let hasCamera = false

  try {
    hasCamera = await QrScanner.hasCamera()
  } catch (error: unknown) {
    throw new QRError(
      'CAMERA_CHECK_FAILED',
      getErrorMessage(error, 'Unable to check camera availability')
    )
  }

  if (!hasCamera)
    throw new QRError(
      'NO_CAMERA_AVAILABLE',
      'QR-Code scanning requires a camera'
    )

  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = 'transparent'
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
    let scanner: QrScanner | undefined

    const finalize = (): boolean => {
      if (settled) return false
      settled = true

      ac.abort()
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)

      try {
        scanner?.stop()
      } catch {}
      try {
        scanner?.destroy()
      } catch {}

      try {
        dialog.remove()
      } catch {}

      return true
    }

    const rejectWithQRError = (error: QRError): void => {
      if (!finalize()) return
      reject(error)
    }

    const resolveWithData = (data: string): void => {
      if (!finalize()) return
      resolve(data)
    }

    const abort = (): void =>
      rejectWithQRError(
        new QRError('SCAN_CANCELLED', 'QR-Code scanning was cancelled')
      )

    const onPointerUp = (): void => abort()
    const onMouseUp = (): void => abort()
    const onTouchEnd = (): void => abort()
    const onKeyDown = (): void => abort()

    setTimeout(() => {
      window.addEventListener('pointerup', onPointerUp, { signal: ac.signal })
      window.addEventListener('mouseup', onMouseUp, { signal: ac.signal })
      window.addEventListener('touchend', onTouchEnd, { signal: ac.signal })
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

    scanner = new QrScanner(
      video,
      (result: QrScanner.ScanResult) => {
        resolveWithData(result.data)
      },
      {
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: () => {},
      }
    )

    scanner.start().catch((error: unknown) => {
      rejectWithQRError(
        new QRError(
          'SCAN_START_FAILED',
          getErrorMessage(error, 'Unable to start QR scanner')
        )
      )
    })
  })
}
