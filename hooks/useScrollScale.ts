"use client"

import { useEffect, useRef, useState } from "react"

interface UseScrollScaleOptions {
  minScale?: number
  maxScale?: number
  startOffset?: number
  endOffset?: number
}

export function useScrollScale({
  minScale = 0.8,
  maxScale = 1.2,
  startOffset = 0,
  endOffset = 400,
}: UseScrollScaleOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(maxScale)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const elementRect = ref.current.getBoundingClientRect()
      const elementTop = elementRect.top
      const elementCenter = elementTop + elementRect.height / 2
      const windowHeight = window.innerHeight

      // Only scale when element is in viewport
      // Max scale when element is centered on screen
      // Min scale when element is far from center
      const distanceFromCenter = Math.abs(elementCenter - windowHeight / 2)
      const maxDistance = windowHeight / 2
      const progress = Math.max(0, 1 - distanceFromCenter / maxDistance)

      // Calculate scale based on progress - smoother transition
      const newScale = minScale + (maxScale - minScale) * progress

      setScale(newScale)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    // Call once on mount to set initial value
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [minScale, maxScale])

  return { ref, scale }
}
