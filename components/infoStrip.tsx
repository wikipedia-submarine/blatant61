"use client"

import { MapPin, ShieldCheck, Clock } from "lucide-react"
import Image from "next/image"

export function InfoStrip() {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 pb-12 md:pb-16 relative z-10">
      <div className="w-full relative group">
        {/* Ambient environmental shadow beneath container */}
        <div className="absolute inset-x-8 -bottom-3 h-[60%] rounded-[32px] bg-[#dce3ed]/20 blur-2xl pointer-events-none" />
        
        {/* Main Container */}
        <div className="w-full relative overflow-hidden rounded-[32px]
          shadow-[0_2px_4px_rgba(107,122,144,0.04),_0_8px_24px_rgba(107,122,144,0.05),_0_20px_48px_rgba(107,122,144,0.03),_inset_0_1px_0_rgba(255,255,255,0.8)]
          border border-[#e2e8f0]/60
          transition-all duration-700 ease-out
          hover:shadow-[0_2px_4px_rgba(107,122,144,0.04),_0_12px_32px_rgba(107,122,144,0.07),_0_24px_56px_rgba(107,122,144,0.04),_inset_0_1px_0_rgba(255,255,255,0.9)]
        ">
          
          {/* Background Image - Using native img for perfect sharpness and no compression */}
          <img 
            src="/images/4.png"
            alt="Info Strip Background"
            className="absolute inset-0 w-full h-full object-cover object-[center_10%] z-0"
          />

          {/* Subtle light overlay to brighten without blurring */}
          <div className="absolute inset-0 z-[1] transition-all duration-700" 
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
            }}
          />

          {/* Faint top-edge light reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1px] z-[2] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          {/* Content Wrapper */}
          <div className="relative z-10 py-10 md:py-12 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 w-full">
            
            {/* Item 1 */}
            <div className="flex-1 flex items-center justify-center gap-5 px-4 w-full md:border-r border-[#6B7A90]/[0.06] group/item">
              <div className="w-[48px] h-[48px] rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0 
                shadow-[0_2px_8px_rgba(107,122,144,0.06),_inset_0_1px_0_rgba(255,255,255,0.9)] border border-white/50
                transition-all duration-500 ease-out
                group-hover/item:bg-white/90 group-hover/item:shadow-[0_4px_16px_rgba(107,122,144,0.08),_inset_0_1px_0_rgba(255,255,255,1)] group-hover/item:scale-[1.03]
              ">
                <MapPin className="w-[20px] h-[20px] text-[#6B7A90] stroke-[1.5] transition-colors duration-500 group-hover/item:text-[#111111]" />
              </div>
              <p className="text-[#111111]/85 font-semibold text-[14px] leading-snug max-w-[180px] transition-colors duration-500 group-hover/item:text-[#111111]">
                Handpicked venues across Georgia
              </p>
            </div>

            {/* Item 2 */}
            <div className="flex-1 flex items-center justify-center gap-5 px-4 w-full md:border-r border-[#6B7A90]/[0.06] group/item">
              <div className="w-[48px] h-[48px] rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0 
                shadow-[0_2px_8px_rgba(107,122,144,0.06),_inset_0_1px_0_rgba(255,255,255,0.9)] border border-white/50
                transition-all duration-500 ease-out
                group-hover/item:bg-white/90 group-hover/item:shadow-[0_4px_16px_rgba(107,122,144,0.08),_inset_0_1px_0_rgba(255,255,255,1)] group-hover/item:scale-[1.03]
              ">
                <ShieldCheck className="w-[20px] h-[20px] text-[#6B7A90] stroke-[1.5] transition-colors duration-500 group-hover/item:text-[#111111]" />
              </div>
              <p className="text-[#111111]/85 font-semibold text-[14px] leading-snug max-w-[180px] transition-colors duration-500 group-hover/item:text-[#111111]">
                Verified hosts and premium spaces
              </p>
            </div>

            {/* Item 3 */}
            <div className="flex-1 flex items-center justify-center gap-5 px-4 w-full group/item">
              <div className="w-[48px] h-[48px] rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shrink-0 
                shadow-[0_2px_8px_rgba(107,122,144,0.06),_inset_0_1px_0_rgba(255,255,255,0.9)] border border-white/50
                transition-all duration-500 ease-out
                group-hover/item:bg-white/90 group-hover/item:shadow-[0_4px_16px_rgba(107,122,144,0.08),_inset_0_1px_0_rgba(255,255,255,1)] group-hover/item:scale-[1.03]
              ">
                <Clock className="w-[20px] h-[20px] text-[#6B7A90] stroke-[1.5] transition-colors duration-500 group-hover/item:text-[#111111]" />
              </div>
              <p className="text-[#111111]/85 font-semibold text-[14px] leading-snug max-w-[180px] transition-colors duration-500 group-hover/item:text-[#111111]">
                Instant booking for selected properties
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
