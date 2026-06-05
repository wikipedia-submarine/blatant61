"use client"

import { useTransition } from "react"

export function GlobalLoading() {
  const [isPending] = useTransition()

  if (!isPending) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-background/85 backdrop-blur-md flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Enhanced blue spinning loader */}
        <div className="relative w-24 h-24">
          {/* Outer rotating gradient ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin"
            style={{ animationDuration: "1.5s" }}
          />

          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full border-3 border-blue-500/30 animate-pulse" />

          {/* Inner counter-rotating ring */}
          <div
            className="absolute inset-3 rounded-full border-3 border-transparent border-b-blue-600 border-l-blue-500/50 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "2s" }}
          />

          {/* Center glow effect */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-500/40 via-blue-400/20 to-transparent blur-lg animate-pulse" />

          {/* Ultra bright center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-400 blur-sm animate-pulse" />
          </div>
        </div>

        {/* Loading text with animation */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">
            Loading<span className="inline-block w-1 h-1 bg-blue-500 rounded-full mx-1 animate-bounce" style={{ animationDelay: "0s" }}>.</span>
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full mx-1 animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full mx-1 animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
