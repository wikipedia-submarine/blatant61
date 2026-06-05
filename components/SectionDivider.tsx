"use client"

import { Sparkles, Star } from "lucide-react"
import { motion } from "framer-motion"
import { ScrollReveal } from "./scrollReveal"

export function SectionDivider() {
  return (
    <div className="relative h-8 md:h-10 flex items-center justify-center overflow-visible z-20">
      {/* Continuous Connection Line - Tighter Fade */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-16 lg:px-32">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/30 20%, via-accent/30 80%, to-transparent" />
      </div>

      {/* Background Decorative Glow - Very Subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-accent/5 rounded-full blur-[40px] pointer-events-none" />
    </div>
  )
}
