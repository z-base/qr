[![npm version](https://img.shields.io/npm/v/@z-base/qr)](https://www.npmjs.com/package/@z-base/qr)
[![CI](https://github.com/z-base/qr/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/z-base/qr/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/z-base/qr/branch/master/graph/badge.svg)](https://codecov.io/gh/z-base/qr)
[![license](https://img.shields.io/npm/l/@z-base/qr)](LICENSE)

# qr

A simple, managed QR toolset for browser frontends. It gives SPAs a small API to display, print, and scan QR codes with typed errors and zero framework lock-in.

## Compatibility

- Runtimes: modern browsers (primary target); Node >= 18 for build/test workflows.
- Module format: ESM-only.
- Required browser APIs: `document`, `<dialog>`, `Blob`, `URL.createObjectURL`, and camera/media APIs for scanning.
- TypeScript: bundled types.

## Goals

- Minimal API for common frontend QR workflows.
- Managed UI flows for display, print, and scan.
- Typed, explicit errors for predictable app-level handling.
- Works cleanly in SPA environments without framework-specific code.

## Installation

```sh
npm install @z-base/qr
# or
pnpm add @z-base/qr
# or
yarn add @z-base/qr
```

## Usage

```ts
import { QR, QRError } from '@z-base/qr'

QR.display('https://example.com')
QR.print('https://example.com')

try {
  const value = await QR.scan()
  console.log(value)
} catch (error) {
  if (error instanceof QRError) {
    console.error(error.code, error.message)
  } else {
    console.error(error)
  }
}
```

You can also import function-level APIs directly:

```ts
import { display, print, scan } from '@z-base/qr'
```

## API

### `QR.display(value: string): void`

- Opens a modal dialog with a generated QR image for `value`.
- Closes on user interaction (pointer/mouse/touch/key) after a short guard delay.

### `QR.print(value: string): void`

- Opens a new tab with an A4 print layout of ID-1 sized QR cards.
- Triggers the browser print dialog automatically.

### `QR.scan(): Promise<string>`

- Opens a modal camera scanner.
- Resolves with decoded QR payload.
- Rejects with `QRError` when scanning cannot proceed or is cancelled.

## Errors

The package throws `QRError` with semantic `code` values:

- `VALUE_IS_NOT_A_STRING`
- `QR_ENCODE_FAILED`
- `NO_CAMERA_AVAILABLE`
- `CAMERA_CHECK_FAILED`
- `SCAN_CANCELLED`
- `SCAN_START_FAILED`

## Runtime Notes

- This package is browser-first and UI-driven.
- `scan()` requires camera permission and a compatible device/browser.
- `print()` relies on popup/new-tab behavior and browser print support.

## Tests

- Suite: unit + integration (Node), E2E (Playwright)
- Matrix: Chromium / Firefox / WebKit + mobile emulation (Pixel 5, iPhone 12)
- Coverage: c8 - 100% statements/branches/functions/lines

## License

Apache-2.0
