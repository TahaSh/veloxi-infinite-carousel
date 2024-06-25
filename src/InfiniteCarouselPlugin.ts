import { DragEvent, DragEventPlugin, PluginFactory, Utils, View } from 'veloxi'

const MIN_OPACITY = 0.35

export class NextEvent {}
export class PreviousEvent {}

export const InfiniteCarouselPlugin: PluginFactory = (context) => {
  const dragEventPlugin = context.useEventPlugin(DragEventPlugin)
  dragEventPlugin.on(DragEvent, onDrag)

  let draggingWidth: number = 0
  let totalDragging: number = 0
  let container: View
  let items: View[]
  let totalItems: number
  let containerX: number
  let startDraggingX: number = 0

  function getCurrentIndex() {
    return parseInt(container.data.currentIndex)
  }

  context.onDataChanged((data) => {
    if (data.dataName === 'currentIndex') {
      update()
    }
  })

  function itemWidth() {
    return container.size.width
  }

  function updateOpacity() {
    const initialX = container.position.initialX

    items.forEach((item) => {
      const progress = Utils.pointToViewProgress(
        { x: initialX },
        item,
        itemWidth()
      )
      const opacity = Utils.remap(progress, 0, 1, MIN_OPACITY, 1)
      item.opacity.set(opacity, false)
    })
  }

  function onClick(item: View) {
    const clickedIndex = items.indexOf(item)
    if (clickedIndex === nextIndex()) {
      context.emit(NextEvent, {})
    } else if (clickedIndex === previousIndex()) {
      context.emit(PreviousEvent, {})
    }
  }

  function onDrag(event: DragEvent) {
    if (event.isDragging) {
      if (!startDraggingX) {
        startDraggingX = containerX
      }
      container.position.set({ x: startDraggingX + event.width }, false)
      draggingWidth = Math.abs(event.width) - totalDragging
      updateOpacity()
    } else {
      if (event.width === 0) {
        onClick(event.view)
      }
      startDraggingX = 0
      totalDragging = 0
      draggingWidth = 0
      update()
      if (Math.abs(event.x - event.previousX) > 18) {
        if (event.x < event.previousX) {
          context.emit(NextEvent, {})
        } else if (event.x > event.previousX) {
          context.emit(PreviousEvent, {})
        }
      }
    }
    if (draggingWidth >= (container.size.width * 2) / 3) {
      totalDragging = Math.abs(event.width) + (container.size.width * 2) / 3
      draggingWidth = 0
      if (event.directions.includes('left')) {
        context.emit(NextEvent, {})
      } else if (event.directions.includes('right')) {
        context.emit(PreviousEvent, {})
      }
    }
  }

  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

  context.setup(() => {
    container = context.getView('container')!
    container.position.setAnimator('spring', { damping: 0.64, stiffness: 0.7 })
    items = context.getViews('item')
    items.forEach((item) => {
      item.opacity.setAnimator('tween', {
        duration: 200,
        ease: easeOutQuad
      })
      dragEventPlugin.addView(item)
    })
    totalItems = items.length
    update()

    window.addEventListener('resize', update)
  })

  function update() {
    updateContainerPosition()
    updateItems()
  }

  function updateContainerPosition() {
    const initialX = container.position.initialX
    containerX = initialX - getCurrentIndex() * itemWidth()
    container.position.set({ x: containerX })
  }

  function localCurrentIndex() {
    return ((getCurrentIndex() % totalItems) + totalItems) % totalItems
  }

  function nextIndex() {
    return (localCurrentIndex() + 1) % totalItems
  }

  function previousIndex() {
    return (localCurrentIndex() - 1 + totalItems) % totalItems
  }

  function updateItems() {
    const currentIndex = getCurrentIndex()
    const totalWidth = itemWidth() * totalItems
    const segment = Math.floor(currentIndex / totalItems)
    const baseX = container.position.initialX + segment * totalWidth
    const currentIndexPosition = baseX + localCurrentIndex() * itemWidth()
    items.forEach((item, index) => {
      if (index === localCurrentIndex()) {
        item.opacity.set(1, context.initialized)
      } else {
        item.opacity.set(MIN_OPACITY, context.initialized)
      }
      if (index === previousIndex()) {
        item.position.set({ x: currentIndexPosition - itemWidth() })
      } else if (index === nextIndex()) {
        item.position.set({ x: currentIndexPosition + itemWidth() })
      } else if (!context.initialized || index === localCurrentIndex()) {
        item.position.set({ x: baseX + index * itemWidth() })
      }
    })
  }
}

InfiniteCarouselPlugin.pluginName = 'InfiniteCarousel'
