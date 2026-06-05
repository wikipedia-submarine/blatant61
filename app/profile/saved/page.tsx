"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Users, Heart, Loader2, Grid2X2, List, ChevronDown, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getVenuesByIds, type FirestoreVenue } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { Header } from "@/components/header"

export default function SavedVenuesPage() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [savedVenues, setSavedVenues] = useState<FirestoreVenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSavedVenues() {
      if (!userProfile?.savedVenueIds || userProfile.savedVenueIds.length === 0) {
        setSavedVenues([])
        setLoading(false)
        return
      }

      try {
        const venues = await getVenuesByIds(userProfile.savedVenueIds)
        
        // Resolve images for each venue
        const venuesWithResolvedImages = await Promise.all(
          venues.map(async (venue) => {
            if (venue.images && venue.images[0]?.startsWith("firestore://")) {
              try {
                const imageId = venue.images[0].replace("firestore://", "")
                const resolvedUrl = await getImageFromFirestore(imageId)
                if (resolvedUrl) {
                  return { ...venue, images: [resolvedUrl, ...venue.images.slice(1)] }
                }
              } catch (e) {
                console.error("Error resolving image", e)
              }
            }
            return venue
          })
        )
        
        setSavedVenues(venuesWithResolvedImages)
      } catch (error) {
        console.error("Error fetching saved venues:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchSavedVenues()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, userProfile?.savedVenueIds, authLoading])

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] pt-32 px-6 flex flex-col items-center justify-center text-center">
        <Header />
        <Heart className="w-16 h-16 text-[#6B7A90]/30 mb-6" />
        <h1 className="text-3xl font-extrabold text-[#111111] mb-4">Please sign in</h1>
        <p className="text-[#6B7A90] mb-8 max-w-md">
          You need to be signed in to view your saved venues.
        </p>
        <Link 
          href="/sign-in" 
          className="px-8 py-3 bg-[#111111] text-white rounded-full font-bold hover:bg-black transition-all"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] font-sans">
      <Header />
      
      <div className="pt-[104px] px-6 md:px-12 max-w-[1320px] mx-auto pb-20">
        
        {/* Banner Section */}
        <div className="relative w-full rounded-[24px] overflow-hidden border border-[#E7ECF3] shadow-[0_8px_40px_rgba(107,122,144,0.06)] min-h-[160px] md:min-h-[180px] flex items-center p-8 md:p-10">
          <Image 
            src="/images/saved.png" 
            alt="Saved Venues Banner" 
            fill 
            className="object-cover" 
            priority
          />
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-[20px] bg-white border border-[#E7ECF3] flex items-center justify-center shadow-sm shrink-0">
              <Heart className="w-8 h-8 fill-[#4A90D9] text-[#4A90D9]" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#111111] tracking-tight leading-none mb-2">
                Saved Venues
              </h1>
              <p className="text-[14px] font-medium text-[#6B7A90]">
                {savedVenues.length} {savedVenues.length === 1 ? "venue" : "venues"} saved to your list
              </p>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-8">
          <div className="flex p-1 rounded-[12px] bg-white border border-[#E7ECF3] shadow-sm w-fit">
            <button className="p-2 rounded-[8px] bg-[#F5F7FB] text-[#111111]">
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-[8px] text-[#6B7A90] hover:text-[#111111] transition-colors">
              <List className="w-4 h-4" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-white border border-[#E7ECF3] shadow-sm text-[#111111] font-semibold text-[13px] hover:bg-[#F8FAFC] transition-colors w-fit">
            Recently saved <ChevronDown className="w-4 h-4 text-[#6B7A90]" />
          </button>
        </div>

        {/* Venue Grid */}
        {savedVenues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[24px] border border-[#E7ECF3] shadow-[0_4px_24px_rgba(107,122,144,0.04)]">
            <Heart className="w-12 h-12 text-[#E7ECF3] mx-auto mb-4" />
            <h2 className="text-[18px] font-bold text-[#111111] mb-2">No saved venues yet</h2>
            <p className="text-[#6B7A90] text-[14px] mb-8 max-w-sm mx-auto">
              Explore our amazing spaces and click the heart icon to save them for later.
            </p>
            <Link 
              href="/browse" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white rounded-[12px] text-[14px] font-bold hover:bg-black transition-all"
            >
              Browse Spaces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedVenues.map((venue) => {
              const venueName = typeof venue.spaceName === 'string' && venue.spaceName in t.venueData
                ? t.venueData[venue.spaceName as keyof typeof t.venueData]
                : venue.spaceName
              
              const venueLocation = typeof venue.location === 'string' && venue.location in t.venueData
                ? t.venueData[venue.location as keyof typeof t.venueData]
                : venue.location

              return (
                <div key={venue.id} className="bg-white rounded-[24px] overflow-hidden border border-[#E7ECF3] shadow-[0_4px_24px_rgba(107,122,144,0.04)] hover:shadow-[0_12px_40px_rgba(107,122,144,0.08)] transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
                  
                  <Link href={`/venues/${venue.id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-[#F5F7FB]">
                    <Image 
                      src={venue.images?.[0] || "/images/venues/default.jpg"} 
                      alt={venueName} 
                      fill 
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    <button className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
                      <Heart className="w-4 h-4 fill-[#4A90D9] text-[#4A90D9]" />
                    </button>
                  </Link>

                  <div className="p-6 flex flex-col flex-1">
                    <Link href={`/venues/${venue.id}`} className="block mb-1">
                      <h3 className="text-[16px] font-bold text-[#111111] line-clamp-1 group-hover:text-[#4A90D9] transition-colors">
                        {venueName}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-[#6B7A90] mb-6">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[13px] font-medium line-clamp-1">
                        {venueLocation}
                      </span>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex items-center gap-1.5 text-[#6B7A90]">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-bold">
                          Up to {venue.maxGuests} guests
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] font-extrabold text-[#111111]">
                          ${venue.price}
                        </span>
                        <span className="text-[12px] text-[#6B7A90] font-medium">
                          /night
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/venues/${venue.id}`} className="w-full py-4 border-t border-[#E7ECF3] flex justify-center items-center gap-2 text-[13px] font-bold text-[#111111] hover:bg-[#F8FAFC] transition-colors bg-white">
                    View details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        {savedVenues.length > 0 && (
          <div className="py-20 flex flex-col items-center text-center">
            <Heart className="w-6 h-6 text-[#E7ECF3] mb-4" />
            <h3 className="text-[14px] font-bold text-[#111111]">
              Can't find a venue you saved?
            </h3>
            <p className="text-[13px] text-[#6B7A90] mt-1 mb-6">
              Explore more amazing spaces for your next event.
            </p>
            <Link 
              href="/browse" 
              className="px-6 py-3 rounded-[12px] bg-[#111111] text-white text-[13px] font-bold hover:bg-black transition-colors shadow-[0_4px_14px_rgba(17,17,17,0.15)]"
            >
              Browse venues
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
