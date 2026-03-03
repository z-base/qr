import assert from 'node:assert/strict'
import test from 'node:test'

import { attachDialogBackdropFade } from '../../dist/.helpers/attachDialogBackdropFade/index.js'
import { attachFadeStyles } from '../../dist/.helpers/attachFadeStyles/index.js'

function createDialogDouble(animate) {
  const listeners = new Map()

  const addEventListener = (type, listener, options = {}) => {
    const set = listeners.get(type) ?? new Set()
    set.add({ listener, once: Boolean(options.once) })
    listeners.set(type, set)
  }

  const removeEventListener = (type, listener) => {
    const set = listeners.get(type)
    if (!set) return
    for (const entry of [...set]) {
      if (entry.listener === listener) set.delete(entry)
    }
    if (set.size === 0) listeners.delete(type)
  }

  const dispatch = (type, event = {}) => {
    const set = listeners.get(type)
    if (!set) return
    for (const entry of [...set]) {
      entry.listener(event)
      if (entry.once) set.delete(entry)
    }
    if (set.size === 0) listeners.delete(type)
  }

  return {
    animate,
    addEventListener,
    removeEventListener,
    dispatch,
  }
}

test('attachFadeStyles supports requestAnimationFrame and restores inline styles', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  let rafCalls = 0

  globalThis.requestAnimationFrame = (callback) => {
    rafCalls += 1
    callback()
    return rafCalls
  }

  try {
    const element = {
      style: {
        opacity: '0.25',
        transitionProperty: 'transform',
        transitionDuration: '50ms',
        transitionTimingFunction: 'linear',
      },
    }

    const fade = attachFadeStyles(element, 123)

    assert.equal(element.style.opacity, '0')
    assert.equal(element.style.transitionProperty, 'opacity')
    assert.equal(element.style.transitionDuration, '123ms')
    assert.equal(element.style.transitionTimingFunction, 'ease')

    fade.reveal()
    assert.equal(rafCalls, 2)
    assert.equal(element.style.opacity, '1')

    fade.hide()
    assert.equal(element.style.opacity, '0')

    fade.detach()
    assert.equal(element.style.opacity, '0.25')
    assert.equal(element.style.transitionProperty, 'transform')
    assert.equal(element.style.transitionDuration, '50ms')
    assert.equal(element.style.transitionTimingFunction, 'linear')
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
})

test('attachDialogBackdropFade animates and cancels active animations', () => {
  let cancelCalls = 0
  const animateCalls = []

  const dialog = createDialogDouble((frames, options) => {
    animateCalls.push({ frames, options })
    return {
      cancel() {
        cancelCalls += 1
      },
    }
  })

  const fade = attachDialogBackdropFade(dialog, 240)
  fade.reveal()
  fade.hide()
  fade.detach()

  assert.equal(animateCalls.length, 2)
  assert.equal(animateCalls[0].options.pseudoElement, '::backdrop')
  assert.equal(animateCalls[1].options.pseudoElement, '::backdrop')
  assert.equal(cancelCalls >= 2, true)
})

test('attachDialogBackdropFade falls back when backdrop animation is unsupported', () => {
  const originalDocument = globalThis.document
  const originalGetComputedStyle = globalThis.getComputedStyle
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout

  const appended = []
  const clearedTimeouts = []
  let timeoutId = 0

  globalThis.document = {
    body: {
      append(node) {
        appended.push(node)
      },
    },
    createElement: () => ({
      style: {},
      removed: false,
      remove() {
        this.removed = true
      },
    }),
  }

  globalThis.getComputedStyle = () => {
    throw new Error('unsupported pseudo-element')
  }
  globalThis.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  globalThis.setTimeout = (callback, delay, ...args) => {
    timeoutId += 1
    const id = timeoutId
    if (delay === 0) callback(...args)
    return id
  }
  globalThis.clearTimeout = (id) => {
    clearedTimeouts.push(id)
  }

  const dialog = createDialogDouble(() => {
    throw new Error('unsupported')
  })

  try {
    const fade = attachDialogBackdropFade(dialog, 180)
    fade.hide()
    fade.hide()

    dialog.dispatch('close')
    assert.equal(appended.length, 1)
    assert.equal(appended[0].style.opacity, '0')
    assert.equal(appended[0].style.background, 'rgba(0, 0, 0, 0.3)')

    fade.detach()
    assert.equal(appended[0].removed, true)
    assert.equal(clearedTimeouts.length >= 1, true)
  } finally {
    globalThis.document = originalDocument
    globalThis.getComputedStyle = originalGetComputedStyle
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
  }
})

test('attachDialogBackdropFade fallback timeout removes temporary overlay', () => {
  const originalDocument = globalThis.document
  const originalGetComputedStyle = globalThis.getComputedStyle
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout

  const appended = []

  globalThis.document = {
    body: {
      append(node) {
        appended.push(node)
      },
    },
    createElement: () => ({
      style: {},
      removed: false,
      remove() {
        this.removed = true
      },
    }),
  }

  globalThis.getComputedStyle = () => ({ backgroundColor: 'rgba(9, 8, 7, 0.6)' })
  globalThis.requestAnimationFrame = undefined
  globalThis.setTimeout = (callback, _delay, ...args) => {
    callback(...args)
    return 1
  }
  globalThis.clearTimeout = () => {}

  const dialog = createDialogDouble(() => {
    throw new Error('unsupported')
  })

  try {
    const fade = attachDialogBackdropFade(dialog, 120)
    fade.hide()
    dialog.dispatch('close')
    assert.equal(appended.length, 1)
    assert.equal(appended[0].style.background, 'rgba(9, 8, 7, 0.6)')
    assert.equal(appended[0].removed, true)
  } finally {
    globalThis.document = originalDocument
    globalThis.getComputedStyle = originalGetComputedStyle
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
  }
})

test('attachDialogBackdropFade fallback exits when body is unavailable', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame

  globalThis.document = {
    body: null,
    createElement: () => ({ style: {}, remove() {} }),
  }
  globalThis.requestAnimationFrame = undefined

  const dialog = createDialogDouble(() => {
    throw new Error('unsupported')
  })

  try {
    const fade = attachDialogBackdropFade(dialog, 90)
    fade.hide()
    dialog.dispatch('close')
    fade.detach()
  } finally {
    globalThis.document = originalDocument
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
})

test('attachDialogBackdropFade detach tolerates animation cancel errors', () => {
  const dialog = createDialogDouble(() => ({
    cancel() {
      throw new Error('cancel failed')
    },
  }))

  const fade = attachDialogBackdropFade(dialog, 90)
  fade.reveal()
  fade.detach()
})
