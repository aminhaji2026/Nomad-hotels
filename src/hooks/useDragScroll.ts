import { useEffect } from 'react'

/**
 * Enables click-drag horizontal scrolling on overflow rails.
 * Native overflow already handles touch/wheel; this covers desktop mouse drag.
 * Vertical gestures are left alone so the page can scroll.
 */
export function useDragScroll(selector = '.h-scroll, .hero-reel__track') {
  useEffect(() => {
    const bound = new WeakSet<HTMLElement>()
    const cleanups: Array<() => void> = []

    const bind = (el: HTMLElement) => {
      if (bound.has(el)) return
      bound.add(el)

      let active = false
      let dragging = false
      let startX = 0
      let startY = 0
      let startLeft = 0
      let moved = false

      const onDown = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return
        if (event.button !== 0) return
        active = true
        dragging = false
        moved = false
        startX = event.clientX
        startY = event.clientY
        startLeft = el.scrollLeft
      }

      const onMove = (event: PointerEvent) => {
        if (!active) return
        const dx = event.clientX - startX
        const dy = event.clientY - startY

        if (!dragging) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
          // Vertical intent → release so the page can scroll.
          if (Math.abs(dy) > Math.abs(dx)) {
            active = false
            return
          }
          dragging = true
          el.setPointerCapture(event.pointerId)
          el.classList.add('is-dragging')
        }

        moved = true
        el.scrollLeft = startLeft - dx
        event.preventDefault()
      }

      const onUp = (event: PointerEvent) => {
        if (!active && !dragging) return
        active = false
        if (dragging) {
          dragging = false
          el.classList.remove('is-dragging')
          try {
            el.releasePointerCapture(event.pointerId)
          } catch {
            /* already released */
          }
        }
      }

      const onClickCapture = (event: MouseEvent) => {
        if (!moved) return
        event.preventDefault()
        event.stopPropagation()
        moved = false
      }

      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      el.addEventListener('click', onClickCapture, true)

      cleanups.push(() => {
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        el.removeEventListener('click', onClickCapture, true)
      })
    }

    const scan = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach(bind)
    }

    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [selector])
}
