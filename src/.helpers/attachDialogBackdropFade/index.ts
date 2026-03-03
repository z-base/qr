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

export function attachDialogBackdropFade(
  dialog: HTMLDialogElement,
  durationMs: number
): { reveal: () => void; hide: () => void; detach: () => void } {
  let animation: Animation | undefined
  let supportsBackdropAnimation: boolean | undefined
  let closeListener: (() => void) | undefined
  let fallbackTimeout: ReturnType<typeof setTimeout> | undefined
  let fallbackOverlay: HTMLDivElement | undefined

  const detachFallbackOverlay = (): void => {
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout)
      fallbackTimeout = undefined
    }
    fallbackOverlay?.remove()
    fallbackOverlay = undefined
  }

  const detachCloseListener = (): void => {
    if (!closeListener) return
    dialog.removeEventListener('close', closeListener)
    closeListener = undefined
  }

  const animateBackdrop = (from: number, to: number): boolean => {
    if (supportsBackdropAnimation === false) return false
    if (typeof dialog.animate !== 'function') {
      supportsBackdropAnimation = false
      return false
    }
    try {
      animation?.cancel()
      animation = dialog.animate([{ opacity: from }, { opacity: to }], {
        duration: durationMs,
        easing: 'ease',
        fill: 'forwards',
        pseudoElement: '::backdrop',
      })
      supportsBackdropAnimation = true
      return true
    } catch {
      supportsBackdropAnimation = false
      return false
    }
  }

  return {
    reveal: () => {
      detachCloseListener()
      detachFallbackOverlay()
      animateBackdrop(0, 1)
    },
    hide: () => {
      if (animateBackdrop(1, 0)) return

      detachCloseListener()
      detachFallbackOverlay()

      closeListener = () => {
        closeListener = undefined

        if (!document.body) return

        let backdropColor = 'rgba(0, 0, 0, 0.3)'
        if (typeof globalThis.getComputedStyle === 'function') {
          try {
            const computed = globalThis.getComputedStyle(dialog, '::backdrop')
            if (computed.backgroundColor.trim().length > 0)
              backdropColor = computed.backgroundColor
          } catch {}
        }

        const overlay = document.createElement('div')
        fallbackOverlay = overlay
        overlay.style.position = 'fixed'
        overlay.style.inset = '0'
        overlay.style.pointerEvents = 'none'
        overlay.style.opacity = '1'
        overlay.style.background = backdropColor
        overlay.style.transitionProperty = 'opacity'
        overlay.style.transitionDuration = `${durationMs}ms`
        overlay.style.transitionTimingFunction = 'ease'
        overlay.style.zIndex = '2147483647'
        document.body.append(overlay)

        const fadeOverlay = (): void => {
          overlay.style.opacity = '0'
          fallbackTimeout = setTimeout(() => {
            if (fallbackOverlay === overlay) fallbackOverlay = undefined
            overlay.remove()
            fallbackTimeout = undefined
          }, durationMs)
        }

        if (typeof globalThis.requestAnimationFrame === 'function')
          globalThis.requestAnimationFrame(fadeOverlay)
        else setTimeout(fadeOverlay, 0)
      }

      dialog.addEventListener('close', closeListener, { once: true })
    },
    detach: () => {
      detachCloseListener()
      detachFallbackOverlay()
      try {
        animation?.cancel()
      } catch {}
    },
  }
}
