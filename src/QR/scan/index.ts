import QrScanner from 'qr-scanner'
import { QRError } from '../../.errors/class.js'
import { attachFadeStyles } from '../../.helpers/attachFadeStyles/index.js'
import { attachDialogBackdropFade } from '../../.helpers/attachDialogBackdropFade/index.js'
import { getErrorMessage } from '../../.helpers/getErrorMessage/index.js'

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
  const fadeMs = 333
  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = 'transparent'
  dialog.style.borderRadius = '1rem'
  dialog.style.outline = 'none'
  dialog.style.width = 'min(80vw, 400px)'
  dialog.style.aspectRatio = '1 / 1'
  dialog.style.overflow = 'hidden'
  const dialogBackdropFade = attachDialogBackdropFade(dialog, fadeMs)
  const dialogFade = attachFadeStyles(dialog, fadeMs)

  const video = document.createElement('video')
  video.setAttribute('playsinline', 'true')
  video.muted = true
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.display = 'block'
  video.style.objectFit = 'cover'
  video.style.aspectRatio = '1 / 1'
  const videoFade = attachFadeStyles(video, fadeMs)

  dialog.append(video)
  document.body.append(dialog)
  dialog.showModal()
  dialogBackdropFade.reveal()
  dialogFade.reveal()

  return new Promise<string>((resolve, reject) => {
    const ac = new AbortController()
    let settled = false
    let scanner: QrScanner | undefined
    let childrenVisible = false
    const childFades = new Map<HTMLElement, ReturnType<typeof attachFadeStyles>>()

    const revealChildren = (): void => {
      if (childrenVisible) return
      childrenVisible = true
      videoFade.reveal()
      for (const childFade of childFades.values()) childFade.reveal()
    }

    const registerChildFade = (node: unknown): void => {
      if (node === video) return
      if (typeof node !== 'object' || node === null || !('style' in node))
        return
      const element = node as HTMLElement
      if (childFades.has(element)) return
      const fade = attachFadeStyles(element, fadeMs)
      childFades.set(element, fade)
      if (childrenVisible) fade.reveal()
    }

    const unregisterChildFade = (node: unknown): void => {
      if (typeof node !== 'object' || node === null || !('style' in node))
        return
      const element = node as HTMLElement
      const fade = childFades.get(element)
      if (!fade) return
      fade.detach()
      childFades.delete(element)
    }

    const onVideoLoadedData = (): void => revealChildren()
    const onVideoPlaying = (): void => revealChildren()
    video.addEventListener('loadeddata', onVideoLoadedData, {
      signal: ac.signal,
    })
    video.addEventListener('playing', onVideoPlaying, { signal: ac.signal })
    if (video.readyState >= 2) revealChildren()

    const childObserver =
      typeof globalThis.MutationObserver === 'function'
        ? new globalThis.MutationObserver((records) => {
            for (const record of records) {
              for (const node of Array.from(record.addedNodes)) {
                registerChildFade(node)
              }
              for (const node of Array.from(record.removedNodes)) {
                unregisterChildFade(node)
              }
            }
          })
        : undefined
    childObserver?.observe(dialog, { childList: true })

    const finalize = (done: () => void): void => {
      if (settled) return
      settled = true

      ac.abort()
      childObserver?.disconnect()
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)

      dialogBackdropFade.hide()
      dialogFade.hide()
      videoFade.hide()
      for (const childFade of childFades.values()) childFade.hide()

      setTimeout(() => {
        try {
          scanner?.stop()
        } catch {}
        try {
          scanner?.destroy()
        } catch {}

        dialogBackdropFade.detach()
        dialogFade.detach()
        videoFade.detach()
        for (const childFade of childFades.values()) childFade.detach()
        childFades.clear()

        try {
          dialog.remove()
        } catch {}

        done()
      }, fadeMs)
    }

    const rejectWithQRError = (error: QRError): void => {
      finalize(() => reject(error))
    }

    const resolveWithData = (data: string): void => {
      finalize(() => resolve(data))
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
    }, fadeMs)

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
