"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLoadingContext } from "@/lib/loading-context"
import { useEffect, useState } from "react"

export function Preloader() {
  const { isInitialLoading } = useLoadingContext()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!isInitialLoading) {
      // Small delay to allow fade out animation to finish before unmounting
      const timer = setTimeout(() => setShow(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isInitialLoading])

  if (!show) return null

  return (
    <AnimatePresence>
      {isInitialLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-background"
        >
          <div className="relative flex flex-col items-center">
            {/* Main Logo Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div 
                  className="text-4xl md:text-6xl font-black tracking-tighter text-foreground"
                  initial={{ letterSpacing: "0.2em", opacity: 0 }}
                  animate={{ letterSpacing: "-0.05em", opacity: 1 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  EVENT <span className="text-[#4a5f7f]">VENUES</span>
                </motion.div>
                
                {/* Subtle light sweep effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -skew-x-12"
                  initial={{ x: "-150%" }}
                  animate={{ x: "150%" }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Premium Loader Bar */}
            <div className="w-48 h-[2px] bg-border/50 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#4a5f7f] shadow-[0_0_10px_rgba(74,95,127,0.3)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>

            {/* Minimalist Status Text */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold"
            >
              Initializing Experience
            </motion.div>
          </div>

          {/* Background Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4a5f7f] rounded-full blur-[120px]"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-[#ffd60a] rounded-full blur-[100px]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
