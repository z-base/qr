import { QR } from './dist/index.js'
globalThis.qr = QR

document.getElementById('display-qr').addEventListener('pointerup', () => {
  QR.display(document.getElementById('qr-value-input').value)
})

document.getElementById('print-qr').addEventListener('pointerup', () => {
  QR.print(document.getElementById('qr-value-input').value)
})

document.getElementById('scan-qr').addEventListener('pointerup', async () => {
  document.getElementById('qr-scan-output').textContent = await QR.scan()
})
