"use client"

import Link from "next/link"
import { Building2, Home, Layout, TreePine, PartyPopper, BedDouble, ArrowRight } from "lucide-react"
import { FocusPlane } from "./focusPlane"

const CATEGORIES = [
  {
    title: "Rooftops",
    count: "32 venues",
    image: "/images/venues/rooftop-terrace.jpg",
    icon: Building2,
  },
  {
    title: "Villas",
    count: "48 venues",
    image: "/images/venues/garden-villa.jpg",
    icon: Home,
  },
  {
    title: "Modern Spaces",
    count: "64 venues",
    image: "/images/venues/skyline-penthouse.jpg",
    icon: Layout,
  },
  {
    title: "Outdoor Spaces",
    count: "36 venues",
    image: "/images/venues/seaside-villa.jpg",
    icon: TreePine,
  },
  {
    title: "Event Halls",
    count: "28 venues",
    image: "/images/venues/loft-studio.jpg",
    icon: PartyPopper,
  },
  {
    title: "Unique Stays",
    count: "21 venues",
    image: "/images/venues/mountain-retreat.jpg",
    icon: BedDouble,
  },
]

export function ExploreByCategory() {
  return (
    <section className="w-full overflow-hidden bg-[#EEF3F8] relative z-[20]">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-10 md:py-12 section-atmosphere relative z-[1]">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-[#1a1a1c] text-2xl md:text-3xl font-bold tracking-tight">
            Explore by category
          </h2>
          <Link 
            href="/browse" 
            className="group flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1c] hover:opacity-70 transition-opacity"
          >
            View all categories
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {CATEGORIES.map((cat, i) => (
            <Link 
              key={i}
              href={`/browse?category=${cat.title.toLowerCase().replace(" ", "-")}`}
              className="group relative h-[240px] md:h-[280px] lg:h-[340px] overflow-hidden flex flex-col justify-end cursor-pointer isolate w-full block shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 rounded-md md:rounded-lg"
            >
            {/* Background Image */}
            <div 
              className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${cat.image})` }}
            />
            {/* Cinematic Bottom Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-[60%] -z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
            
            {/* Content */}
            <div className="relative z-10 p-5 md:p-6 w-full flex flex-col items-start transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-2px]">
              <h3 className="text-white font-semibold text-[17px] md:text-[19px] leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {cat.title}
              </h3>
              <p className="text-white/70 font-medium text-[12px] md:text-[13px] mt-1">
                {cat.count}
              </p>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </section>
  )
}
