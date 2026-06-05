"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Users, Heart, ChevronRight } from "lucide-react"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { Skeleton } from "./ui/skeleton"

interface BrowseVenueCardProps {
  venue: {
    id: number | string
    nameKey: string
    locationKey: string
    price: number
    guests: number
    image: string
    premium?: boolean
    firestoreId?: string
  }
  resolveLabel: (key: string) => string
}

export function BrowseVenueCard({ venue, resolveLabel }: BrowseVenueCardProps) {
  const [resolvedImage, setResolvedImage] = useState<string | null>(
    venue.image.startsWith("firestore://") ? null : venue.image
  )
  const [imageLoading, setImageLoading] = useState(venue.image.startsWith("firestore://"))
  const [isFavorited, setIsFavorited] = useState(false)

  const venueName = resolveLabel(venue.nameKey)
  const venueLocation = resolveLabel(venue.locationKey)

  const isHardcodedVenue = typeof venue.id === 'number' && venue.id >= 1 && venue.id <= 6
  const detailPageId = isHardcodedVenue ? venue.id : venue.firestoreId

  useEffect(() => {
    let isMounted = true

    async function resolveImage() {
      if (venue.image.startsWith("firestore://")) {
        try {
          const imageId = venue.image.replace("firestore://", "")
          const resolved = await getImageFromFirestore(imageId)
          if (isMounted && resolved) {
            setResolvedImage(resolved)
          }
        } catch (error) {
          console.error("Failed to resolve image:", error)
        } finally {
          if (isMounted) setImageLoading(false)
        }
      }
    }

    resolveImage()
    return () => { isMounted = false }
  }, [venue.image])

  return (
    <div className="group relative bg-white rounded-[16px] overflow-hidden border border-[#E7ECF3] hover:shadow-[0_12px_40px_rgba(107,122,144,0.1)] transition-shadow duration-250 ease-out cursor-pointer w-full">
      <Link href={`/venues/${detailPageId}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F8FAFC]">
          {imageLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <Image
              src={resolvedImage || "/images/venues/default.jpg"}
              alt={venueName}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-250 ease-out"
              loading="lazy"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          )}

          {/* Premium Badge */}
          {venue.premium && (
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                Popular
              </span>
            </div>
          )}

          {/* Favorite Heart */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsFavorited(!isFavorited)
            }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? "fill-[#4A90D9] text-[#4A90D9]" : "text-[#6B7A90]"
              }`}
            />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-[15px] font-bold text-[#111111] mb-1.5 truncate leading-snug">
            {venueName}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-[#6B7A90] mb-3">
            <MapPin className="w-3 h-3" />
            <span className="text-[12px] font-medium truncate">
              {venueLocation}
            </span>
          </div>

          {/* Guests + Price Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-[#6B7A90]">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[12px] font-medium">
                Up to {venue.guests} guests
              </span>
            </div>

            <div className="text-right">
              <span className="text-[16px] font-bold text-[#111111]">${venue.price}</span>
              <span className="text-[11px] text-[#6B7A90] font-medium ml-1">/night</span>
            </div>
          </div>

          {/* View Details Button */}
          <button className="w-full py-2 px-4 rounded-[10px] border border-[#E7ECF3] text-[13px] font-semibold text-[#111111] flex items-center justify-center gap-1 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
            View details
            <ChevronRight className="w-3.5 h-3.5 text-[#6B7A90]" />
          </button>
        </div>
      </Link>
    </div>
  )
}

export function BrowseVenueCardSkeleton() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[#E7ECF3] w-full">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-9 w-full rounded-[10px]" />
      </div>
    </div>
  )
}
