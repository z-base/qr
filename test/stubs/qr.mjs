const calls = []

export function resetQrStub() {
  calls.length = 0
}

export function getQrCalls() {
  return [...calls]
}

export default function encodeQR(value, output) {
  calls.push({ value, output })

  if (value === '__THROW_QR__') throw new Error('forced qr encode failure')

  return `<svg data-value="${value}" data-output="${output}"></svg>`
}
