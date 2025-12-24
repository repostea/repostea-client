import { ref, onMounted, onUnmounted, readonly, type Ref } from 'vue'

export interface TouchGestureOptions {
  swipeThreshold?: number
  tapTimeout?: number
  longPressTimeout?: number
  preventDefaultTouchEvents?: boolean
}

export const useTouchGestures = (
  element: Ref<HTMLElement | null>,
  options: TouchGestureOptions = {}
) => {
  const {
    swipeThreshold = 50,
    tapTimeout = 200,
    longPressTimeout = 500,
    preventDefaultTouchEvents = false,
  } = options

  // Touch state
  const touchStart = ref<{ x: number; y: number; time: number } | null>(null)
  const isLongPress = ref(false)
  const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  // Event handlers
  const onTouchStart = (event: TouchEvent) => {
    if (preventDefaultTouchEvents) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    touchStart.value = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }

    isLongPress.value = false

    // Start long press timer
    longPressTimer.value = setTimeout(() => {
      isLongPress.value = true
      onLongPress(event)
    }, longPressTimeout)
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!touchStart.value) return

    // Cancel long press if finger moves too much
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStart.value.x)
    const deltaY = Math.abs(touch.clientY - touchStart.value.y)

    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
    }
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (!touchStart.value) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStart.value.x
    const deltaY = touch.clientY - touchStart.value.y
    const deltaTime = Date.now() - touchStart.value.time

    // Clear long press timer
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    // Handle swipe gestures
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      const direction = getSwipeDirection(deltaX, deltaY)
      onSwipe(direction, { deltaX, deltaY, deltaTime })
    }
    // Handle tap if not a long press and quick enough
    else if (!isLongPress.value && deltaTime < tapTimeout) {
      onTap(event)
    }

    touchStart.value = null
    isLongPress.value = false
  }

  const getSwipeDirection = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  // Event emitters
  const onTap = (event: TouchEvent) => {
    // Emit tap event
    if (element.value) {
      element.value.dispatchEvent(
        new CustomEvent('gesture-tap', {
          detail: { originalEvent: event },
        })
      )
    }
  }

  const onLongPress = (event: TouchEvent) => {
    // Emit long press event
    if (element.value) {
      element.value.dispatchEvent(
        new CustomEvent('gesture-longpress', {
          detail: { originalEvent: event },
        })
      )
    }
  }

  const onSwipe = (direction: string, data: any) => {
    // Emit swipe event
    if (element.value) {
      element.value.dispatchEvent(
        new CustomEvent(`gesture-swipe-${direction}`, {
          detail: data,
        })
      )
      element.value.dispatchEvent(
        new CustomEvent('gesture-swipe', {
          detail: { direction, ...data },
        })
      )
    }
  }

  // Lifecycle
  onMounted(() => {
    if (!element.value || !import.meta.client) return

    element.value.addEventListener('touchstart', onTouchStart, {
      passive: !preventDefaultTouchEvents,
    })
    element.value.addEventListener('touchmove', onTouchMove, { passive: true })
    element.value.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (!element.value || !import.meta.client) return

    element.value.removeEventListener('touchstart', onTouchStart)
    element.value.removeEventListener('touchmove', onTouchMove)
    element.value.removeEventListener('touchend', onTouchEnd)

    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
    }
  })

  return {
    touchStart: readonly(touchStart),
    isLongPress: readonly(isLongPress),
  }
}
