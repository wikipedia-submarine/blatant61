"use client"

import { useLoadingContext } from "@/lib/loading-context"

export function LoadingScreen() {
  const { isLoading } = useLoadingContext()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none">
      {/* Animated Background Gradients removed per user request */}

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated Logo/Spinner - Enhanced design */}
        <div className="relative w-24 h-24">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-apple-blue border-r-apple-blue/50 animate-spin duration-3000" />

          {/* Middle counter-rotating ring */}
          <div className="absolute inset-3 rounded-full border-3 border-transparent border-b-accent border-l-accent/50 animate-spin animation-reverse duration-4000" />

          {/* Inner rotating accent ring */}
          <div className="absolute inset-6 rounded-full border-2 border-transparent border-t-apple-green border-r-apple-green/30 animate-spin duration-5000" />

          {/* Core pulsing glow */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/30 to-apple-blue/20 animate-pulse duration-2000" />

          {/* Outer glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/10 to-transparent blur-lg animate-pulse duration-3000 animation-delay-300" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-apple-blue to-apple-green bg-clip-text text-transparent">Loading</h2>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-loading-dot animation-delay-100" />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full animate-loading-dot animation-delay-200" />
              <span className="w-1.5 h-1.5 bg-apple-green rounded-full animate-loading-dot animation-delay-300" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Taking you somewhere amazing...</p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="w-56 h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-border/20 via-border/40 to-border/20 shadow-lg shadow-accent/10">
          <div className="h-full bg-gradient-to-r from-transparent via-gradient-flow to-transparent rounded-full animate-slide-progress-enhanced" />
        </div>

        {/* Loading percentage (optional, commented out) */}
        <p className="text-xs text-muted-foreground/70 font-semibold tracking-wider">PLEASE WAIT</p>
      </div>
    </div>
  )
}
