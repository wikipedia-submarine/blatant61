"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring, motion } from "framer-motion"
import { useLoadingContext } from "@/lib/loading-context"

interface Props {
  value: number
  duration?: number
  delay?: number
  suffix?: string
  decimals?: number
  startOnMount?: boolean
}

export function Counter({
  value,
  duration = 2,
  delay = 0,
  suffix = "",
  decimals = 0,
  startOnMount = false,
}: Props) {
  const { isInitialLoading } = useLoadingContext()
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  })

  useEffect(() => {
    if (!isInitialLoading && (startOnMount || isInView)) {
      const timer = setTimeout(() => {
        motionValue.set(value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [startOnMount, isInitialLoading, isInView, value, motionValue, delay])

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toFixed(decimals) + suffix
      }
    })
  }, [springValue, decimals, suffix])

  return <span ref={ref} className="tabular-nums">0{suffix}</span>
}
