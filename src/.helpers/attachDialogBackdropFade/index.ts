export function attachDialogBackdropFade(
  dialog: HTMLDialogElement,
  durationMs: number
): { reveal: () => void; hide: () => void; detach: () => void } {
  let animation: Animation | undefined

  const animateBackdrop = (from: number, to: number): void => {
    if (typeof dialog.animate !== 'function') return
    try {
      animation?.cancel()
      animation = dialog.animate([{ opacity: from }, { opacity: to }], {
        duration: durationMs,
        easing: 'ease',
        fill: 'forwards',
        pseudoElement: '::backdrop',
      })
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
