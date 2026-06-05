"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase opacity-80">Loading...</p>
      </div>
    </div>
  )
}
