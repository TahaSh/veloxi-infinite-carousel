import {
  InfiniteCarouselPlugin,
  NextEvent,
  PreviousEvent
} from './InfiniteCarouselPlugin'
import './style.css'
import { createApp } from 'veloxi'

const app = createApp()
app.addPlugin(InfiniteCarouselPlugin)
app.run()

const container = document.querySelector(
  '.infinite-carousel .item-container'
) as HTMLElement

app.onPluginEvent(InfiniteCarouselPlugin, PreviousEvent, () => {
  const currentIndex = parseInt(container.dataset.velDataCurrentIndex!)
  container.dataset.velDataCurrentIndex = `${currentIndex - 1}`
})
app.onPluginEvent(InfiniteCarouselPlugin, NextEvent, () => {
  const currentIndex = parseInt(container.dataset.velDataCurrentIndex!)
  container.dataset.velDataCurrentIndex = `${currentIndex + 1}`
})
