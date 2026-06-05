"use client"

import { ReactNode, useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

interface FocusPlaneProps {
  children: ReactNode
  className?: string
  /** Which side of the grid this card sits on. Controls compression direction. */
  side?: "left" | "right" | "center"
}

/**
 * Center-focus compression effect.
 * 
 * Cards enter the viewport feeling slightly COMPRESSED INWARD toward the
 * center axis, then RELEASE OUTWARD into their natural grid position.
 * 
 * Left cards:  start shifted +X (toward center) → settle to 0
 * Right cards: start shifted -X (toward center) → settle to 0
 * 
 * Once settled, the element is completely locked. No continuous motion.
 */
export function FocusPlane({ children, className = "", side = "center" }: FocusPlaneProps) {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    // Element enters from bottom, fully settled by the time it's 30% into viewport
    offset: ["start end", "start 0.7"]
  })

  // Magnetic spring — decisive settle, no bounce
  const smooth = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001
  })

  // Compression: cards start shifted INWARD toward center axis
  // Left-side cards shift right (+18px), right-side shift left (-18px)
  const compressX = side === "left" ? 18 : side === "right" ? -18 : 0
  const x = useTransform(smooth, [0, 1], [compressX, 0])

  // Very subtle scale — NOT the primary effect
  const scale = useTransform(smooth, [0, 1], [0.97, 1])

  // Minimal opacity — just enough to feel like depth, never looks disabled
  const opacity = useTransform(smooth, [0, 1], [0.94, 1])

  return (
    <motion.div
      ref={ref}
      style={{ x, scale, opacity, willChange: "transform, opacity" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
