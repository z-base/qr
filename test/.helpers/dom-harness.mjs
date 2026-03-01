class FakeEventTarget {
  constructor() {
    this.listeners = new Map()
  }

  addEventListener(type, listener) {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type, listener) {
    const set = this.listeners.get(type)
    if (!set) return
    set.delete(listener)
    if (set.size === 0) this.listeners.delete(type)
  }

  dispatch(type, event = {}) {
    const set = this.listeners.get(type)
    if (!set) return
    for (const listener of [...set]) listener(event)
  }
}

class FakeElement extends FakeEventTarget {
  constructor(tagName) {
    super()
    this.tagName = tagName.toUpperCase()
    this.style = {}
    this.attributes = {}
    this.children = []
    this.removed = false
    this.removeCalls = 0
    this.showModalCalls = 0
    this.clickCalls = 0
    this.onload = null
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value)
  }

  append(child) {
    this.children.push(child)
  }

  remove() {
    this.removeCalls += 1
    this.removed = true
  }

  showModal() {
    this.showModalCalls += 1
  }

  click() {
    this.clickCalls += 1
  }
}

export function installDomHarness(options = {}) {
  const originals = {
    document: globalThis.document,
    window: globalThis.window,
    URL: globalThis.URL,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  }

  const createdElements = []
  const createdObjectUrls = []
  const revokedObjectUrls = []
  const timeoutCalls = []

  const body = new FakeElement('body')
  const document = {
    body,
    createElement: (tagName) => {
      const element = new FakeElement(tagName)
      if (tagName === 'dialog' && options.dialogRemoveThrows) {
        element.remove = () => {
          element.removeCalls += 1
          throw new Error('dialog remove failed')
        }
      }
      createdElements.push(element)
      return element
    },
  }

  const windowTarget = new FakeEventTarget()
  const window = {
    addEventListener: windowTarget.addEventListener.bind(windowTarget),
    removeEventListener: windowTarget.removeEventListener.bind(windowTarget),
    dispatch(type, event = {}) {
      windowTarget.dispatch(type, event)
    },
    focus() {},
    print() {},
    close() {},
  }

  const URLStub = {
    createObjectURL(blob) {
      const value = `blob:test-${createdObjectUrls.length + 1}`
      createdObjectUrls.push({ value, blob })
      return value
    },
    revokeObjectURL(value) {
      revokedObjectUrls.push(value)
    },
  }

  const setTimeoutStub = (callback, delay, ...args) => {
    timeoutCalls.push(delay)
    callback(...args)
    return timeoutCalls.length
  }

  const clearTimeoutStub = () => {}

  globalThis.document = document
  globalThis.window = window
  globalThis.URL = URLStub
  globalThis.setTimeout = setTimeoutStub
  globalThis.clearTimeout = clearTimeoutStub

  return {
    body,
    createdElements,
    createdObjectUrls,
    revokedObjectUrls,
    timeoutCalls,
    getLastElement(tagName) {
      for (let i = createdElements.length - 1; i >= 0; i -= 1) {
        const candidate = createdElements[i]
        if (candidate.tagName === tagName.toUpperCase()) return candidate
      }
      return undefined
    },
    dispatchWindow(type, event = {}) {
      window.dispatch(type, event)
    },
    restore() {
      globalThis.document = originals.document
      globalThis.window = originals.window
      globalThis.URL = originals.URL
      globalThis.setTimeout = originals.setTimeout
      globalThis.clearTimeout = originals.clearTimeout
    },
  }
}
