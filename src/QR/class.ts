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
   * @returns A function that removes the dialog from the document.
   * @throws {TypeError} Thrown if `value` is not a string.
   */
  static display(value: string): Function {
    return display(value)
  }
  /**
   * Opens a new tab and presents a print-optimized layout containing QR code(s) for the specified string.
   *
   * The QR code is generated as SVG and embedded into a document sized for the selected paper format.
   * Depending on `options.layout`, the document contains either a single, centered card-sized QR or
   * a max-fit grid of card-sized QRs with cut guides.
   *
   * @param value The string to encode.
   * @param options Options controlling the paper format and layout.
   * @throws {TypeError} Thrown if `value` is not a string.
   */
  static print(value: string) {
    return print(value)
  }
  /**
   * Displays a modal dialog that streams the device camera and scans for a QR code.
   *
   * The dialog closes automatically once a QR code is decoded and the decoded payload is returned.
   *
   * @returns A promise that fulfills with the decoded QR code content.
   * @throws {Error} If no camera is available.
   */
  static async scan(): Promise<string> {
    return await scan()
  }
}
