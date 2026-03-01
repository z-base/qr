export type QRErrorCode = 'VALUE_IS_NOT_A_STRING' | 'NO_CAMERA_AVAILABLE'

export class QRError extends Error {
  readonly code: QRErrorCode

  constructor(code: QRErrorCode, message?: string) {
    const detail = message ?? code
    super(`{@z-base/qr} ${detail}`)
    this.code = code
    this.name = 'QRError'
  }
}
