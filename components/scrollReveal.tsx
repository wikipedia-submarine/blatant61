"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useLoadingContext } from "@/lib/loading-context"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  animation?: "up" | "left" | "right" | "scale" | "reveal"
  delay?: number
  duration?: number
  stagger?: boolean
}

const animations = {
  up: {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
        mass: 1
      }
    }
  },
  left: {
    hidden: { x: -40, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100
      }
    }
  },
  right: {
    hidden: { x: 40, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100
      }
    }
  },
  scale: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100
      }
    }
  },
  reveal: {
    hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
    visible: { 
      clipPath: "inset(0 0% 0 0)", 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }
}

export function ScrollReveal({ 
  children, 
  className = "", 
  animation = "up", 
  delay = 0,
  duration = 0.5,
  stagger = false
}: ScrollRevealProps) {
  const { isInitialLoading } = useLoadingContext()

  return (
    <motion.div
      initial="hidden"
      animate={isInitialLoading ? "hidden" : undefined}
      whileInView={isInitialLoading ? undefined : "visible"}
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: animations[animation].hidden,
        visible: {
          ...animations[animation].visible,
          transition: {
            ...animations[animation].visible.transition,
            delay: delay,
            duration: duration,
            staggerChildren: stagger ? 0.08 : 0
          } as any
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
