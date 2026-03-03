/*
 * Copyright 2026 z-base
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type QRErrorCode =
  | 'VALUE_IS_NOT_A_STRING'
  | 'NO_CAMERA_AVAILABLE'
  | 'CAMERA_CHECK_FAILED'
  | 'QR_ENCODE_FAILED'
  | 'SCAN_CANCELLED'
  | 'SCAN_START_FAILED'

export class QRError extends Error {
  readonly code: QRErrorCode

  constructor(code: QRErrorCode, message?: string) {
    const detail = message ?? code
    super(`{@z-base/qr} ${detail}`)
    this.code = code
    this.name = 'QRError'
  }
}
