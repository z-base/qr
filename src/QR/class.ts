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

import { display } from './display/index.js'
import { print } from './print/index.js'
import { scan } from './scan/index.js'
export class QR {
  /**
   * Displays a modal dialog containing a QR code representation of the specified string.
   *
   * The QR code is rendered as an SVG image using a `blob:` URL.
   *
   * @param value The string to encode.
   * @throws {QRError} Thrown if `value` is not a string or QR encoding fails.
   */
  static display(value: string): void {
    return display(value)
  }
  /**
   * Opens a new tab containing an A4 print layout of card-sized QR codes for the specified string.
   *
   * The QR code is generated as SVG and repeated into a centered grid of ID-1 card tiles with
   * dotted cut guides and corner crop marks, then the print dialog is invoked.
   *
   * @param value The string to encode.
   * @throws {QRError} Thrown if `value` is not a string or QR encoding fails.
   */
  static print(value: string): void {
    return print(value)
  }
  /**
   * Displays a modal dialog that streams the device camera and scans for a QR code.
   *
   * The dialog closes once a QR code is decoded and returns the decoded payload.
   *
   * @returns A promise that fulfills with the decoded QR code string.
   * @throws {QRError} If camera availability cannot be checked, no camera is available, the scan is cancelled, or scanner startup fails.
   */
  static scan(): Promise<string> {
    return scan()
  }
}
