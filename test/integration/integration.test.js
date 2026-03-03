import assert from 'node:assert/strict'
import test from 'node:test'

import { installDomHarness } from '../.helpers/dom-harness.mjs'
import { QRError } from '../../dist/.errors/class.js'
import { QR, display, print, scan } from '../../dist/index.js'
import { getQrCalls, resetQrStub } from '../stubs/qr.mjs'
import {
  configureQrScannerStub,
  getQrScannerInstances,
  resetQrScannerStub,
} from '../stubs/qr-scanner.mjs'

function assertQRErrorCode(error, code) {
  assert.equal(error instanceof QRError, true)
  assert.equal(error.code, code)
}

test('display rejects non-string values', () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    assert.throws(
      () => display(123),
      (error) => {
        assertQRErrorCode(error, 'VALUE_IS_NOT_A_STRING')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('display maps QR encode failures to QRError', () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    assert.throws(
      () => display('__THROW_QR__'),
      (error) => {
        assertQRErrorCode(error, 'QR_ENCODE_FAILED')
        assert.match(error.message, /forced qr encode failure/)
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('display renders, binds close listeners, and cleans up idempotently', () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    display('hello-world')

    const dialog = dom.getLastElement('dialog')
    const img = dom.getLastElement('img')

    assert.ok(dialog)
    assert.ok(img)
    assert.equal(dialog.showModalCalls, 1)
    assert.equal(dom.timeoutCalls.includes(333), true)

    assert.equal(typeof img.onload, 'function')
    img.onload()

    dom.dispatchWindow('pointerup')
    dialog.dispatch('close')

    assert.equal(dialog.removed, true)
    assert.equal(dialog.removeCalls, 1)
    assert.equal(dom.revokedObjectUrls.length >= 1, true)

    const qrCalls = getQrCalls()
    assert.equal(qrCalls.length > 0, true)
    assert.deepEqual(qrCalls.at(-1), { output: 'svg', value: 'hello-world' })
  } finally {
    dom.restore()
  }
})

test('display handles already-complete image elements', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement
  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'img') element.complete = true
    return element
  }
  try {
    display('already-complete')

    const img = dom.getLastElement('img')
    const dialog = dom.getLastElement('dialog')
    assert.ok(img)
    assert.ok(dialog)
    assert.equal(dom.revokedObjectUrls.length >= 1, true)

    dom.dispatchWindow('pointerup')
    assert.equal(dialog.removed, true)
  } finally {
    dom.restore()
  }
})

test('display ignores repeated close requests while fade-out is in progress', () => {
  resetQrStub()
  const dom = installDomHarness()
  const originalSetTimeout = globalThis.setTimeout
  const pending = []
  let timeoutCalls = 0

  let closeDelayQueued = false
  globalThis.setTimeout = (callback, delay, ...args) => {
    timeoutCalls += 1

    if (delay === 0) {
      callback(...args)
      return timeoutCalls
    }

    if (!closeDelayQueued) {
      closeDelayQueued = true
      callback(...args)
      return timeoutCalls
    }

    pending.push(() => callback(...args))
    return timeoutCalls
  }

  try {
    display('close-guard')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    dom.dispatchWindow('pointerup')
    dom.dispatchWindow('pointerup')

    for (const run of pending) run()

    assert.equal(dialog.removeCalls, 1)
  } finally {
    globalThis.setTimeout = originalSetTimeout
    dom.restore()
  }
})

test('display also closes on mouseup and touchend', () => {
  resetQrStub()

  {
    const dom = installDomHarness()
    try {
      display('close-on-mouseup')
      dom.dispatchWindow('mouseup')

      const dialog = dom.getLastElement('dialog')
      assert.ok(dialog)
      assert.equal(dialog.removed, true)
    } finally {
      dom.restore()
    }
  }

  {
    const dom = installDomHarness()
    try {
      display('close-on-touchend')
      dom.dispatchWindow('touchend')

      const dialog = dom.getLastElement('dialog')
      assert.ok(dialog)
      assert.equal(dialog.removed, true)
    } finally {
      dom.restore()
    }
  }
})

test('print rejects non-string values', () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    assert.throws(
      () => print(false),
      (error) => {
        assertQRErrorCode(error, 'VALUE_IS_NOT_A_STRING')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('print maps QR encode failures to QRError', () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    assert.throws(
      () => print('__THROW_QR__'),
      (error) => {
        assertQRErrorCode(error, 'QR_ENCODE_FAILED')
        assert.match(error.message, /forced qr encode failure/)
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('print creates printable HTML blob and opens new tab link', async () => {
  resetQrStub()
  const dom = installDomHarness()
  try {
    print('print-me')

    const anchor = dom.getLastElement('a')
    assert.ok(anchor)
    assert.equal(anchor.clickCalls, 1)
    assert.equal(anchor.target, '_blank')
    assert.equal(anchor.rel, 'noopener noreferrer')

    assert.equal(dom.createdObjectUrls.length, 1)
    assert.equal(dom.revokedObjectUrls.length, 1)
    assert.equal(dom.timeoutCalls.includes(60000), true)

    const html = await dom.createdObjectUrls[0].blob.text()
    assert.match(html, /<!doctype html>/i)
    assert.match(html, /class="grid"/)
    assert.match(html, /class="card"/)
  } finally {
    dom.restore()
  }
})

test('scan throws CAMERA_CHECK_FAILED when camera probing fails', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraError: new Error('probe failed') })
  const dom = installDomHarness()
  try {
    await assert.rejects(
      () => scan(),
      (error) => {
        assertQRErrorCode(error, 'CAMERA_CHECK_FAILED')
        assert.match(error.message, /probe failed/)
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('scan throws NO_CAMERA_AVAILABLE when no camera exists', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: false })
  const dom = installDomHarness()
  try {
    await assert.rejects(
      () => scan(),
      (error) => {
        assertQRErrorCode(error, 'NO_CAMERA_AVAILABLE')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('scan maps scanner start failures to SCAN_START_FAILED', async () => {
  resetQrScannerStub()
  configureQrScannerStub({
    hasCameraResult: true,
    startError: 'start exploded',
  })
  const dom = installDomHarness()
  try {
    await assert.rejects(
      () => scan(),
      (error) => {
        assertQRErrorCode(error, 'SCAN_START_FAILED')
        assert.match(error.message, /start exploded/)
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('scan resolves decoded data and tolerates late events after settle', async () => {
  resetQrScannerStub()
  configureQrScannerStub({
    autoDecode: true,
    decodeResult: { data: 'decoded-value' },
    hasCameraResult: true,
    stopThrows: true,
    destroyThrows: true,
  })

  const dom = installDomHarness({ dialogRemoveThrows: true })
  try {
    const result = await scan()
    assert.equal(result, 'decoded-value')

    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)
    dialog.dispatch('close')

    const scanner = getQrScannerInstances().at(-1)
    assert.ok(scanner)
    scanner.onDecode({ data: 'late-decode' })
  } finally {
    dom.restore()
  }
})

test('scan rejects with SCAN_CANCELLED on pointer close', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })
  const dom = installDomHarness()
  try {
    const promise = scan()
    await Promise.resolve()
    dom.dispatchWindow('pointerup')

    await assert.rejects(
      () => promise,
      (error) => {
        assertQRErrorCode(error, 'SCAN_CANCELLED')
        return true
      }
    )

    const scanner = getQrScannerInstances().at(-1)
    assert.ok(scanner)
    scanner.onDecode({ data: 'late-after-cancel' })
  } finally {
    dom.restore()
  }
})

test('scan rejects with SCAN_CANCELLED on dialog cancel and prevents default', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })
  const dom = installDomHarness()
  try {
    const promise = scan()
    await Promise.resolve()
    const dialog = dom.getLastElement('dialog')
    assert.ok(dialog)

    const cancelEvent = {
      prevented: false,
      preventDefault() {
        this.prevented = true
      },
    }
    dialog.dispatch('cancel', cancelEvent)
    assert.equal(cancelEvent.prevented, true)

    await assert.rejects(
      () => promise,
      (error) => {
        assertQRErrorCode(error, 'SCAN_CANCELLED')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('scan rejects with SCAN_CANCELLED on mouseup and touchend', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })

  {
    const dom = installDomHarness()
    try {
      const promise = scan()
      await Promise.resolve()
      dom.dispatchWindow('mouseup')

      await assert.rejects(
        () => promise,
        (error) => {
          assertQRErrorCode(error, 'SCAN_CANCELLED')
          return true
        }
      )
    } finally {
      dom.restore()
    }
  }

  {
    const dom = installDomHarness()
    try {
      const promise = scan()
      await Promise.resolve()
      dom.dispatchWindow('touchend')

      await assert.rejects(
        () => promise,
        (error) => {
          assertQRErrorCode(error, 'SCAN_CANCELLED')
          return true
        }
      )
    } finally {
      dom.restore()
    }
  }
})

test('scan handles keydown cancellation and decode error callback execution', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })
  const dom = installDomHarness()
  try {
    const promise = scan()
    await Promise.resolve()

    const scanner = getQrScannerInstances().at(-1)
    assert.ok(scanner)
    assert.equal(typeof scanner.options.onDecodeError, 'function')
    scanner.options.onDecodeError(new Error('ignored decode error'))

    dom.dispatchWindow('keydown')

    await assert.rejects(
      () => promise,
      (error) => {
        assertQRErrorCode(error, 'SCAN_CANCELLED')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})

test('scan tracks dynamic child overlays with dedupe and removal cleanup', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })

  const originalMutationObserver = globalThis.MutationObserver
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const observers = []

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback
      this.disconnected = false
      observers.push(this)
    }

    observe() {}

    disconnect() {
      this.disconnected = true
    }

    emit(records) {
      this.callback(records)
    }
  }

  globalThis.MutationObserver = FakeMutationObserver
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }

  const dom = installDomHarness()
  const originalCreateElement = globalThis.document.createElement
  globalThis.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'video') element.readyState = 2
    return element
  }

  try {
    const promise = scan()
    await Promise.resolve()

    const video = dom.getLastElement('video')
    const observer = observers.at(-1)

    assert.ok(video)
    assert.ok(observer)

    const overlay = { style: {} }
    observer.emit([
      { addedNodes: [video, {}, overlay, overlay], removedNodes: [] },
    ])
    observer.emit([{ addedNodes: [], removedNodes: [overlay] }])

    video.dispatch('loadeddata')
    video.dispatch('playing')

    dom.dispatchWindow('keydown')
    await assert.rejects(
      () => promise,
      (error) => {
        assertQRErrorCode(error, 'SCAN_CANCELLED')
        return true
      }
    )

    assert.equal(observer.disconnected, true)
  } finally {
    dom.restore()
    globalThis.MutationObserver = originalMutationObserver
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
})

test('scan reveals pre-registered child fades and handles unknown removals', async () => {
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: true, autoDecode: false })

  const originalMutationObserver = globalThis.MutationObserver
  const observers = []

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback
      this.disconnected = false
      observers.push(this)
    }

    observe() {}

    disconnect() {
      this.disconnected = true
    }

    emit(records) {
      this.callback(records)
    }
  }

  globalThis.MutationObserver = FakeMutationObserver

  const dom = installDomHarness()
  try {
    const promise = scan()
    await Promise.resolve()

    const video = dom.getLastElement('video')
    const observer = observers.at(-1)

    assert.ok(video)
    assert.ok(observer)

    const keepOverlay = { style: {} }
    const removeOverlay = { style: {} }
    const unknownOverlay = { style: {} }

    observer.emit([
      {
        addedNodes: [keepOverlay, removeOverlay],
        removedNodes: [{}, unknownOverlay, removeOverlay],
      },
    ])

    video.dispatch('loadeddata')

    dom.dispatchWindow('keydown')
    await assert.rejects(
      () => promise,
      (error) => {
        assertQRErrorCode(error, 'SCAN_CANCELLED')
        return true
      }
    )

    assert.equal(observer.disconnected, true)
  } finally {
    dom.restore()
    globalThis.MutationObserver = originalMutationObserver
  }
})

test('QR class delegates to display, print, and scan', async () => {
  resetQrStub()
  resetQrScannerStub()
  configureQrScannerStub({ hasCameraResult: false })
  const dom = installDomHarness()
  try {
    QR.display('via-class-display')
    dom.dispatchWindow('keydown')

    QR.print('via-class-print')
    const anchor = dom.getLastElement('a')
    assert.ok(anchor)
    assert.equal(anchor.clickCalls, 1)

    await assert.rejects(
      () => QR.scan(),
      (error) => {
        assertQRErrorCode(error, 'NO_CAMERA_AVAILABLE')
        return true
      }
    )
  } finally {
    dom.restore()
  }
})
