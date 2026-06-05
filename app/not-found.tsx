"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Compass, Search } from "lucide-react"

// Pre-seeded static positions to avoid SSR/client Math.random() hydration mismatch
const DOT_POSITIONS = [
  { left: 12, top: 23, dur: 14 }, { left: 87, top: 61, dur: 18 }, { left: 45, top: 8, dur: 22 },
  { left: 73, top: 90, dur: 12 }, { left: 31, top: 47, dur: 25 }, { left: 64, top: 33, dur: 16 },
  { left: 5, top: 78, dur: 20 },  { left: 92, top: 15, dur: 13 }, { left: 55, top: 55, dur: 17 },
  { left: 19, top: 92, dur: 21 }, { left: 80, top: 40, dur: 15 }, { left: 40, top: 70, dur: 19 },
  { left: 68, top: 5, dur: 24 },  { left: 25, top: 85, dur: 11 }, { left: 97, top: 50, dur: 23 },
]

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-center items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-8"
        >
          {/* 404 Header */}
          <div className="relative inline-block">
            <motion.h1
              animate={{ scale: [1, 1.02, 1], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="text-[12rem] md:text-[16rem] font-black tracking-tighter text-foreground/5 select-none leading-none"
            >
              404
            </motion.h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-accent rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(var(--accent-rgb),0.5)] animate-bounce-slow">
                <Search className="w-10 h-10 md:w-16 md:h-16 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">Lost in the Celebration?</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              This page could not be found. Don&apos;t worry, your perfect event space is still out there waiting for you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/" className="group relative px-8 py-4 bg-foreground text-background rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Home className="w-5 h-5" />
              Return Home
            </Link>
            <Link href="/browse" className="px-8 py-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-foreground rounded-full font-bold transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95 flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Explore Venues
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative Floating Dots — static positions to avoid hydration mismatch */}
      {DOT_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: pos.dur, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
          className="absolute w-1 h-1 bg-accent rounded-full pointer-events-none"
          style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
        />
      ))}
    </main>
  )
}
