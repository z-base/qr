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

export function attachDialogBackdropFade(
  dialog: HTMLDialogElement,
  durationMs: number
): { reveal: () => void; hide: () => void; detach: () => void } {
  let animation: Animation | undefined

  const animateBackdrop = (from: number, to: number): void => {
    if (typeof dialog.animate !== 'function') return
    try {
      animation?.cancel()
      animation = dialog.animate(
        [{ opacity: from }, { opacity: to }],
        {
          duration: durationMs,
          easing: 'ease',
          fill: 'forwards',
          pseudoElement: '::backdrop',
        }
      )
    } catch {}
  }

  return {
    reveal: () => animateBackdrop(0, 1),
    hide: () => animateBackdrop(1, 0),
    detach: () => {
      try {
        animation?.cancel()
      } catch {}
    },
  }
}
