import encodeQR from 'qr'
import { QRError } from '../../.errors/class.js'

/**
 * Displays a modal dialog containing a QR code representation of the specified string.
 *
 * The QR is rendered as scalable SVG and sized responsively to fit the viewport.
 *
 * @param value The string to encode.
 * @throws {QRError} If `value` is not a string.
 */
export function display(value: string): void {
  if (typeof value !== 'string') {
    throw new QRError(
      'VALUE_IS_NOT_A_STRING',
      'This library only accepts strings as value, use `@z-base/bytecodec` for conversions'
    )
  }

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

  const svgText = encodeQR(value, 'svg')
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

  dialog.append(img)
  document.body.append(dialog)
  dialog.showModal()

  const ac = new AbortController()
  let cleaned = false

  const cleanup = (): void => {
    if (cleaned) return
    cleaned = true

    ac.abort()
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('keydown', onKeyDown)

    img.onload = null
    URL.revokeObjectURL(url)

    dialog.remove()
  }

  img.onload = () => URL.revokeObjectURL(url)

  const onPointerUp = (): void => cleanup()
  const onKeyDown = (): void => cleanup()

  setTimeout(() => {
    window.addEventListener('pointerup', onPointerUp, { signal: ac.signal })
    window.addEventListener('keydown', onKeyDown, { signal: ac.signal })
    dialog.addEventListener('close', cleanup, { signal: ac.signal })
  }, 500)
}
