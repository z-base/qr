import encodeQR from 'qr'

/**
 * Displays a modal dialog containing a QR code representation of the specified string.
 *
 * The QR is rendered as scalable SVG and sized responsively to fit the viewport.
 *
 * @param value The string to encode.
 * @returns A function that removes the dialog from the document.
 * @throws {TypeError} If `value` is not a string.
 */
export function display(value: string): () => void {
  if (typeof value !== 'string') {
    throw new TypeError('value must be a string')
  }

  const dialog = document.createElement('dialog')

  dialog.style.border = 'none'
  dialog.style.padding = '0'
  dialog.style.background = '#fff'
  dialog.style.borderRadius = '1rem'
  dialog.style.display = 'flex'
  dialog.style.alignItems = 'center'
  dialog.style.justifyContent = 'center'

  const svgText = encodeQR(value, 'svg')
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const img = document.createElement('img')
  img.src = url
  img.alt = 'QR code'
  img.style.width = 'min(80vw, 400px)'
  img.style.height = 'auto'
  img.style.aspectRatio = '1 / 1'
  img.style.display = 'block'

  img.onload = () => URL.revokeObjectURL(url)

  dialog.append(img)
  document.body.append(dialog)
  dialog.showModal()

  return () => dialog.remove()
}
