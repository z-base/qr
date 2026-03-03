function runAfterPaint(callback: () => void): void {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(callback)
    })
    return
  }

  setTimeout(callback, 0)
}

export function attachFadeStyles(
  element: HTMLElement,
  durationMs: number
): { reveal: () => void; hide: () => void; detach: () => void } {
  element.style.opacity = '0'
  element.style.transitionProperty = 'opacity'
  element.style.transitionDuration = `${durationMs}ms`
  element.style.transitionTimingFunction = 'ease'

  return {
    reveal: () => runAfterPaint(() => (element.style.opacity = '1')),
    hide: () => (element.style.opacity = '0'),
    detach: () => {
      element.style.transitionProperty = ''
      element.style.transitionDuration = ''
      element.style.transitionTimingFunction = ''
      element.style.opacity = ''
    },
  }
}
