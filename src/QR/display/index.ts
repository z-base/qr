import encodeQR from 'qr'
import { QRError } from '../../.errors/class.js'
import { attachFadeStyles } from '../../.helpers/attachFadeStyles/index.js'
import { attachDialogBackdropFade } from '../../.helpers/attachDialogBackdropFade/index.js'
import { getErrorMessage } from '../../.helpers/getErrorMessage/index.js'

/**
 * Displays a modal dialog containing a QR code representation of the specified string.
 *
 * The QR is rendered as scalable SVG and sized responsively to fit the viewport.
 *
 * @param value The string to encode.
 * @throws {QRError} If `value` is not a string or QR encoding fails.
 */
export function display(value: string): void {
  if (typeof value !== 'string') {
    throw new QRError(
      'VALUE_IS_NOT_A_STRING',
      'This library only accepts strings as value, use `@z-base/bytecodec` for conversions'
    )
  }

  const fadeMs = 333
  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = '#fff'
  dialog.style.borderRadius = '1rem'
  dialog.style.display = 'flex'
  dialog.style.alignItems = 'center'
  dialog.style.justifyContent = 'center'
  dialog.style.outline = 'none'
  dialog.style.overflow = 'hidden'
  const dialogBackdropFade = attachDialogBackdropFade(dialog, fadeMs)
  const dialogFade = attachFadeStyles(dialog, fadeMs)

  let svgText = ''
  try {
    svgText = encodeQR(value, 'svg')
  } catch (error: unknown) {
    throw new QRError(
      'QR_ENCODE_FAILED',
      getErrorMessage(error, 'Unable to encode value as QR SVG')
    )
  }

  const url = URL.createObjectURL(
    new Blob([svgText], { type: 'image/svg+xml' })
  )

  const img = document.createElement('img')
  img.src = url
  img.alt = 'QR code'
  img.style.width = 'min(80vw, 400px)'
  img.style.height = 'auto'
  img.style.aspectRatio = '1 / 1'
  img.style.display = 'block'
  const imgFade = attachFadeStyles(img, fadeMs)

  dialog.append(img)
  document.body.append(dialog)
  dialog.showModal()
  dialogBackdropFade.reveal()
  dialogFade.reveal()

  const ac = new AbortController()
  let cleaned = false
  let closing = false

  const cleanup = (): void => {
    if (cleaned) return
    cleaned = true

    ac.abort()
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('keydown', onKeyDown)

    img.onload = null
    URL.revokeObjectURL(url)

    dialogBackdropFade.detach()
    dialogFade.detach()
    imgFade.detach()
    dialog.remove()
  }

  const requestClose = (): void => {
    if (closing || cleaned) return
    closing = true

    dialogBackdropFade.hide()
    dialogFade.hide()
    imgFade.hide()

    setTimeout(() => {
      try {
        dialog.close()
      } catch {}
      cleanup()
    }, fadeMs)
  }

  img.onload = () => {
    URL.revokeObjectURL(url)
    imgFade.reveal()
  }
  if (img.complete) {
    URL.revokeObjectURL(url)
    imgFade.reveal()
  }

  const onPointerUp = (): void => requestClose()
  const onMouseUp = (): void => requestClose()
  const onTouchEnd = (): void => requestClose()
  const onKeyDown = (): void => requestClose()

  setTimeout(() => {
    window.addEventListener('pointerup', onPointerUp, { signal: ac.signal })
    window.addEventListener('mouseup', onMouseUp, { signal: ac.signal })
    window.addEventListener('touchend', onTouchEnd, { signal: ac.signal })
    window.addEventListener('keydown', onKeyDown, { signal: ac.signal })
    dialog.addEventListener('close', cleanup, { signal: ac.signal })
  }, fadeMs)
}
