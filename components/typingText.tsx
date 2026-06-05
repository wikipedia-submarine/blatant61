"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useState, useRef } from "react"

interface Props {
  text: string
  className?: string
  delay?: number
}

export function TypingText({ text, className = "", delay = 0 }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [displayText, setDisplayText] = useState("")
  
  useEffect(() => {
    if (isInView) {
      let rafId: number
      let timeoutId: number
      const chars = text.split("")
      let current = ""
      let lastUpdateTime = 0
      const charDelay = 30 // ms per character

      const animate = (time: number) => {
        if (!lastUpdateTime) lastUpdateTime = time
        const progress = time - lastUpdateTime

        if (progress >= charDelay) {
          if (current.length < chars.length) {
            current += chars[current.length]
            setDisplayText(current)
            lastUpdateTime = time
          }
        }

        if (current.length < chars.length) {
          rafId = requestAnimationFrame(animate)
        }
      }

      timeoutId = window.setTimeout(() => {
        rafId = requestAnimationFrame(animate)
      }, delay * 1000)

      return () => {
        window.clearTimeout(timeoutId)
        if (rafId) cancelAnimationFrame(rafId)
      }
    }
  }, [isInView, text, delay])

  return (
    <span ref={ref} className={className}>
      {displayText}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
        style={{ display: displayText.length === text.length ? 'none' : 'inline-block' }}
      />
    </span>
  )
}
