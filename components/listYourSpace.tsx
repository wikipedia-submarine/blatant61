"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function ListYourSpace({ className }: { className?: string }) {
  return (
    <div className={`max-w-[1400px] mx-auto relative w-full overflow-hidden flex items-center min-h-[300px] md:min-h-[360px] isolate bg-black shadow-[4px_4px_12px_rgba(0,0,0,0.2)] ${className || ''}`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/1.png')" }}
      />
      
      {/* Gradient Overlay for Text Readability - Custom gradient to prevent banding */}
      <div 
        className="absolute inset-0 -z-10 w-full" 
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0) 100%)' }}
      />

      {/* Strong cinematic vignette around edges to cover corners */}
      <div 
        className="absolute inset-0 -z-[5] pointer-events-none" 
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)' }}
      />

      {/* Fake border radius using an SVG overlay to prevent browser clipping artifacts */}
      <svg 
        className="absolute bottom-0 right-0 w-[24px] h-[24px] text-black pointer-events-none z-[10]" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 24 L 24 24 L 24 0 A 24 24 0 0 1 0 24 Z" />
      </svg>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-16 max-w-[600px]">
        <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
          List your space <span className="text-white/60 font-normal">with Festivo</span>
        </h2>
        <p className="text-white/70 font-medium text-[15px] md:text-base mb-8 max-w-[400px]">
          Reach thousands of guests looking for the perfect venue.
        </p>
        <Link 
          href="/list-your-space"
          className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black rounded-full px-6 py-3.5 font-semibold text-[14px] transition-colors"
        >
          List your space
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
