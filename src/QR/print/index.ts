import encodeQR from 'qr'
import { QRError } from '../../.errors/class.js'
import { getErrorMessage } from '../../.helpers/getErrorMessage/index.js'

/**
 * Opens a new tab containing an A4 print layout of card-sized QR codes for the specified string.
 *
 * The QR code is generated as SVG and repeated into a centered grid of ID-1 (credit card) tiles with
 * dotted cut guides and corner crop marks. The print dialog is then invoked from within the new tab.
 *
 * @param value The string to encode.
 * @throws {QRError} If `value` is not a string or QR encoding fails.
 */
export function print(value: string): void {
  if (typeof value !== 'string')
    throw new QRError(
      'VALUE_IS_NOT_A_STRING',
      'This library only accepts strings as value, use `@z-base/bytecodec` for conversions'
    )

  // A4 portrait, fixed defaults
  const PAGE_MM = { w: 210, h: 297 }
  const PAGE_MARGIN_MM = 8

  // ID-1 credit card
  const CARD_MM = { w: 85.6, h: 53.98 }
  const CARD_PADDING_MM = 4

  // Looks good on card; keep within tile constraints
  const QR_ON_CARD_MM = 42

  // Cut guides / crop marks
  const CUTLINE_MM = 0.35
  const CROP_LEN_MM = 3.5
  const CROP_OFF_MM = 1.2

  const printableW = PAGE_MM.w - 2 * PAGE_MARGIN_MM
  const printableH = PAGE_MM.h - 2 * PAGE_MARGIN_MM

  const cols = Math.max(1, Math.floor(printableW / CARD_MM.w))
  const rows = Math.max(1, Math.floor(printableH / CARD_MM.h))
  const count = cols * rows

  const maxQrMm = CARD_MM.h - 2 * CARD_PADDING_MM
  const qrMm = Math.max(10, Math.min(QR_ON_CARD_MM, maxQrMm))

  let svg = ''
  try {
    svg = encodeQR(value, 'svg')
  } catch (error: unknown) {
    throw new QRError(
      'QR_ENCODE_FAILED',
      getErrorMessage(error, 'Unable to encode value as QR SVG')
    )
  }

  const tiles = Array.from({ length: count }, () => {
    return `<div class="card">
      <div class="qr">${svg}</div>
      <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
    </div>`
  }).join('')

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root{
      --page-margin: ${PAGE_MARGIN_MM}mm;

      --card-w: ${CARD_MM.w}mm;
      --card-h: ${CARD_MM.h}mm;
      --pad: ${CARD_PADDING_MM}mm;

      --qr: ${qrMm}mm;

      --cut: ${CUTLINE_MM}mm;
      --crop-len: ${CROP_LEN_MM}mm;
      --crop-off: ${CROP_OFF_MM}mm;
    }

    @page { size: A4 portrait; margin: var(--page-margin); }

    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }

    .sheet{
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grid{
      display: grid;
      grid-template-columns: repeat(${cols}, var(--card-w));
      grid-template-rows: repeat(${rows}, var(--card-h));
      gap: 0;
    }

    .card{
      position: relative;
      width: var(--card-w);
      height: var(--card-h);
      box-sizing: border-box;

      /* single-thickness shared edges */
      outline: var(--cut) dotted #000;
      outline-offset: calc(-1 * var(--cut));

      display: grid;
      place-items: center;
      padding: var(--pad);
    }

    .qr{
      width: var(--qr);
      height: var(--qr);
      display: grid;
      place-items: center;
    }

    .qr > svg{
      width: 100%;
      height: 100%;
      display: block;
    }

    .crop{
      position: absolute;
      width: var(--crop-len);
      height: var(--crop-len);
      pointer-events: none;
    }
    .crop.tl{ top: var(--crop-off); left: var(--crop-off); border-top: 0.35mm solid #000; border-left: 0.35mm solid #000; }
    .crop.tr{ top: var(--crop-off); right: var(--crop-off); border-top: 0.35mm solid #000; border-right: 0.35mm solid #000; }
    .crop.bl{ bottom: var(--crop-off); left: var(--crop-off); border-bottom: 0.35mm solid #000; border-left: 0.35mm solid #000; }
    .crop.br{ bottom: var(--crop-off); right: var(--crop-off); border-bottom: 0.35mm solid #000; border-right: 0.35mm solid #000; }

    @media screen{
      body { background: #eee; }
      .sheet{ padding: 16px; }
      .grid{ background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="grid">
      ${tiles}
    </div>
  </div>

  <script>
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.focus();
        window.print();
      });
    });
    window.addEventListener('afterprint', () => {
      try { window.close(); } catch {}
    });
  </script>
</body>
</html>`

  const url = URL.createObjectURL(
    new Blob([html], { type: 'text/html;charset=utf-8' })
  )

  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.click()

  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
