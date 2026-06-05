"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Heart, MapPin } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { toggleSavedVenue } from "@/lib/firestore-users"

const FEATURED_VENUES = [
  {
    id: "1",
    title: "Skyline Penthouse",
    location: "Tbilisi",
    price: 450,
    image: "/images/venues/skyline-penthouse.jpg",
    isPopular: true,
  },
  {
    id: "2",
    title: "Garden Villa",
    location: "Tbilisi",
    price: 380,
    image: "/images/venues/garden-villa.jpg",
    isPopular: false,
  },
  {
    id: "3",
    title: "Sunset Rooftop",
    location: "Batumi",
    price: 220,
    image: "/images/venues/rooftop-terrace.jpg",
    isPopular: false,
  },
  {
    id: "4",
    title: "Light Studio",
    location: "Tbilisi",
    price: 280,
    image: "/images/venues/loft-studio.jpg",
    isPopular: false,
  },
]

export function FeaturedVenuesGrid() {
  const router = useRouter()
  const { user, userProfile, updateProfile } = useAuth()

  const handleSave = async (e: React.MouseEvent, venueId: string) => {
    e.preventDefault()
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      const { updatedIds } = await toggleSavedVenue(user.uid, venueId)
      await updateProfile({ savedVenueIds: updatedIds })
    } catch (error) {
      console.error("Failed to save venue:", error)
    }
  }

  const isFavorite = (venueId: string) => {
    return userProfile?.savedVenueIds?.includes(venueId) || false
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 md:py-10 section-atmosphere relative z-[1]">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-[#1a1a1c] text-2xl md:text-3xl font-bold tracking-tight">
          Featured venues
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {FEATURED_VENUES.map((venue, i) => (
          <Link 
            key={venue.id}
            href={`/venues/${venue.id}`}
            className="group relative w-full aspect-[16/9] md:aspect-[16/8] lg:aspect-[16/7] rounded-md md:rounded-lg overflow-hidden flex flex-col justify-between p-6 cursor-pointer isolate block shadow-[0_4px_20px_rgba(107,122,144,0.08),_0_1px_4px_rgba(107,122,144,0.04)] hover:shadow-[0_12px_40px_rgba(107,122,144,0.12),_0_4px_12px_rgba(107,122,144,0.06)] transition-shadow duration-500"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-[1.01]"
              style={{ backgroundImage: `url(${venue.image})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/10 to-black/20 opacity-80" />
            
            {/* Top Bar */}
            <div className="relative z-10 flex items-start justify-between w-full">
              {venue.isPopular ? (
                <div className="bg-black/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  Popular
                </div>
              ) : (
                <div />
              )}
              <button 
                onClick={(e) => handleSave(e, venue.id)}
                className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors z-20 cursor-pointer"
              >
                <Heart className={`w-5 h-5 transition-colors ${isFavorite(venue.id) ? "fill-[#4A90D9] text-[#4A90D9]" : "text-white stroke-[1.5]"}`} />
              </button>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10">
              <h3 className="text-white font-bold text-2xl md:text-[28px] leading-tight mb-1 tracking-tight">
                {venue.title}
              </h3>
              
              <div className="flex items-center gap-1.5 text-white/80 font-medium text-[13px] mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{venue.location}</span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-xl md:text-2xl">${venue.price}</span>
                <span className="text-white/60 font-medium text-[12px] uppercase tracking-wide">/ night</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
