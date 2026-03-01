const defaultState = {
  autoDecode: false,
  decodeResult: { data: 'decoded-from-stub' },
  hasCameraError: null,
  hasCameraResult: true,
  startError: null,
  stopThrows: false,
  destroyThrows: false,
}

const state = { ...defaultState }
const instances = []

export function resetQrScannerStub() {
  Object.assign(state, defaultState)
  instances.length = 0
}

export function configureQrScannerStub(nextState) {
  Object.assign(state, nextState)
}

export function getQrScannerInstances() {
  return [...instances]
}

export default class QrScanner {
  static async hasCamera() {
    if (state.hasCameraError !== null) throw state.hasCameraError
    return state.hasCameraResult
  }

  constructor(video, onDecode, options) {
    this.video = video
    this.onDecode = onDecode
    this.options = options
    this.startCalls = 0
    this.stopCalls = 0
    this.destroyCalls = 0
    instances.push(this)
  }

  start() {
    this.startCalls += 1
    if (state.startError !== null) return Promise.reject(state.startError)

    if (state.autoDecode) {
      const result =
        typeof state.decodeResult === 'function'
          ? state.decodeResult(this)
          : state.decodeResult
      queueMicrotask(() => this.onDecode(result))
    }

    return Promise.resolve()
  }

  stop() {
    this.stopCalls += 1
    if (state.stopThrows) throw new Error('forced stop failure')
  }

  destroy() {
    this.destroyCalls += 1
    if (state.destroyThrows) throw new Error('forced destroy failure')
  }
}
