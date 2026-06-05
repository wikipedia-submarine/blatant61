"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Users, Star, ArrowUpRight } from "lucide-react"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { TypingText } from "./typingText"
import { Skeleton } from "./ui/skeleton"

interface VenueCardProps {
  venue: {
    id: number | string
    nameKey: string
    locationKey: string
    price: number
    guests: number
    image: string
    rating: number
    firestoreId?: string
  }
  index: number
  resolveLabel: (key: string) => string
  t: any
  isMobile?: boolean
  filterKey: number
}

export function VenueCard({ venue, index, resolveLabel, t, isMobile, filterKey }: VenueCardProps) {
  const [resolvedImage, setResolvedImage] = useState<string | null>(
    venue.image.startsWith("firestore://") ? null : venue.image
  )
  const [imageLoading, setImageLoading] = useState(venue.image.startsWith("firestore://"))

  const venueName = resolveLabel(venue.nameKey)
  const venueLocation = resolveLabel(venue.locationKey)

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

  if (isMobile) {
    return (
      <div className="w-[85vw] flex-shrink-0 snap-center group/card">
        <div className="rounded-md md:rounded-lg overflow-hidden flex flex-col h-full"
          style={{
            background: "linear-gradient(180deg, #fafafa 0%, #f4f4f4 100%)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {imageLoading ? (
              <div className="w-full h-full bg-[#eaeaea] animate-pulse" />
            ) : (
              <Image
                src={resolvedImage || "/images/venues/default.jpg"}
                alt={venueName}
                fill
                className="object-cover transition-transform duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.04]"
                sizes="85vw"
              />
            )}
            {/* Cinematic vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            
            {/* Rating badge — frosted glass */}
            <div className="absolute top-3.5 left-3.5 bg-black/50 backdrop-blur-xl px-2.5 py-1 rounded-full flex items-center gap-1 z-20">
              <Star className="w-3 h-3 fill-white text-white" />
              <span className="text-[11px] font-bold text-white">{venue.rating}</span>
            </div>
          </div>

          {/* Info section */}
          <div className="p-5 pt-4 flex flex-col flex-1">
            <h3 className="text-lg font-semibold text-[#1a1a1c] line-clamp-1 leading-tight tracking-tight">{venueName}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[#1a1a1c]/40">
              <MapPin className="w-3 h-3" />
              <span className="text-[11px] font-medium truncate">{venueLocation}</span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-5">
              <div>
                <p className="text-xl font-bold text-[#1a1a1c] tracking-tight">${venue.price}</p>
                <p className="text-[9px] text-[#1a1a1c]/30 uppercase font-bold tracking-wider">{t.venues.perNight}</p>
              </div>
              <Link
                href={`/venues/${venue.firestoreId || venue.id}`}
                className="bg-[#1a1a1c] text-white px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                {t.venues.viewDetails}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      key={`${filterKey}-${venue.id}`}
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: index < 3 ? index * 0.08 : 0,
      }}
      className="group/card relative flex-shrink-0"
      style={{
        width: "var(--card-width, 400px)",
        flex: "0 0 var(--card-width, 400px)",
        scrollSnapAlign: "start",
        height: "var(--card-height, 620px)",
      }}
    >
      <Link href={`/venues/${venue.firestoreId || venue.id}`} className="block h-full">
      <motion.div 
        className="relative h-full rounded-md md:rounded-lg cursor-pointer overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        }}
        whileHover={{ 
          y: -8,
          scale: 1.006,
          boxShadow: "0 12px 32px -8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.03)",
        }}
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1]
        }}
      >
        {/* Image area — dominant, immersive */}
        <div className="relative aspect-[16/11] overflow-hidden">
          <div className="h-full w-full overflow-hidden relative">
            {imageLoading ? (
              <div className="w-full h-full bg-[#e8e8e8] animate-pulse" />
            ) : (
              <Image
                src={resolvedImage || "/images/venues/default.jpg"}
                alt={venueName}
                fill
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.06]"
                loading="lazy"
                sizes="(min-width: 768px) 33vw, 85vw"
              />
            )}
          </div>
          
          {/* Cinematic bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />
          
          {/* Rating badge — frosted dark glass */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-1.5 z-20 border border-white/[0.06]">
            <Star className="w-3.5 h-3.5 fill-white text-white" />
            <span className="text-xs font-bold text-white tracking-tight">{venue.rating}</span>
          </div>

          {/* Guest count — overlaid on image bottom */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-white/60 z-20">
            <Users className="w-3 h-3" />
            <span className="text-[10px] font-semibold tracking-wide">
              {t.venues.upToGuests.replace("{count}", venue.guests.toString())}
            </span>
          </div>
        </div>

        {/* Info section — subtle gradient darker toward bottom for structure */}
        <div className="p-6 lg:p-7 [@media(min-width:1024px)_and_(max-width:1920px)]:p-6 flex flex-col flex-1"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.015) 100%)",
          }}
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-xl md:text-[22px] font-semibold text-[#1a1a1c] tracking-tight leading-tight">
              <TypingText text={venueName} delay={index < 3 ? index * 0.2 + 0.6 : 0.2} />
            </h3>
            <div className="flex items-center gap-1.5 text-[#1a1a1c]/35">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{venueLocation}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-bold text-[#1a1a1c] tracking-tight">${venue.price}</span>
            <span className="text-[10px] text-[#1a1a1c]/30 font-bold uppercase tracking-widest">{t.venues.perNight}</span>
          </div>

          {/* Footer — hidden on small/laptop screens, stays visible on wide screens */}
          <div className="hidden [@media(min-width:1921px)]:block mt-auto pt-5 opacity-100 transition-opacity duration-500 ease-[0.16,1,0.3,1]">
            <div className="h-px bg-black/[0.04] mb-4" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#1a1a1c]/25 uppercase tracking-[0.15em]">
                Curated space
              </span>
              <div className="w-7 h-7 rounded-full bg-[#1a1a1c]/[0.04] flex items-center justify-center group-hover/card:bg-[#1a1a1c] transition-all duration-400 ease-[0.16,1,0.3,1]">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#1a1a1c]/25 group-hover/card:text-white transition-colors duration-400 ease-[0.16,1,0.3,1]" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA button — always visible, muted by default, bold on hover */}
        <div
          className="absolute bottom-6 lg:bottom-7 left-6 lg:left-7 right-6 lg:right-7 [@media(min-width:1024px)_and_(max-width:1920px)]:bottom-6 [@media(min-width:1024px)_and_(max-width:1920px)]:left-6 [@media(min-width:1024px)_and_(max-width:1920px)]:right-6 flex items-center justify-center rounded-2xl text-sm font-bold h-12 lg:h-[52px] active:scale-[0.97] z-20 transition-all duration-[550ms] ease-[0.16,1,0.3,1] bg-[#1a1a1c]/[0.06] text-[#1a1a1c]/40 group-hover/card:bg-[#1a1a1c] group-hover/card:text-white group-hover/card:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
        >
          {t.venues.viewDetails}
        </div>
      </motion.div>
      </Link>
    </motion.div>
  )
}

export function VenueCardSkeleton({ isMobile }: { isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div className="w-[85vw] flex-shrink-0">
        <div className="rounded-md md:rounded-lg overflow-hidden flex flex-col h-full"
          style={{
            background: "linear-gradient(180deg, #fafafa 0%, #f4f4f4 100%)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          <div className="relative aspect-[4/3] w-full bg-[#eaeaea] animate-pulse" />
          <div className="p-5 space-y-4">
            <div className="h-5 w-3/4 rounded-lg bg-black/[0.04] animate-pulse" />
            <div className="h-3 w-1/2 rounded-lg bg-black/[0.04] animate-pulse" />
            <div className="flex justify-between items-center pt-4">
              <div className="h-7 w-1/4 rounded-lg bg-black/[0.04] animate-pulse" />
              <div className="h-9 w-1/3 rounded-xl bg-black/[0.04] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: "var(--card-width, 400px)",
        height: "var(--card-height, 620px)",
      }}
    >
      <div className="h-full rounded-md md:rounded-lg overflow-hidden p-0"
        style={{
          background: "linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <div className="aspect-[16/11] w-full bg-[#e8e8e8] animate-pulse" />
        <div className="p-7 space-y-5">
          <div className="space-y-2">
            <div className="h-6 w-3/4 rounded-lg bg-black/[0.04] animate-pulse" />
            <div className="h-3.5 w-1/2 rounded-lg bg-black/[0.04] animate-pulse" />
          </div>
          <div className="h-8 w-1/3 rounded-lg bg-black/[0.04] animate-pulse" />
          <div className="hidden [@media(min-width:1921px)]:block pt-6">
            <div className="h-px bg-black/[0.04] mb-4" />
            <div className="flex justify-between items-center">
              <div className="h-3 w-1/4 rounded-lg bg-black/[0.04] animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-black/[0.04] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
