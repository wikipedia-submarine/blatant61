"use client"

import { useState, useRef, useEffect, useCallback, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, ArrowRight, Users, MapPin, ArrowUpRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getApprovedVenues } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { ScrollReveal } from "./scrollReveal"
import "./featured-venues.css"

interface Venue {
  id: number; nameKey: string; locationKey: string; price: number; guests: number
  bedrooms?: number; baths?: number; image: string; images: string[]; rating: number
  reviews: number; category: string; isPopular?: boolean; firestoreId?: string
}

const venues: Venue[] = [
  { id: 1, nameKey: "skylinePenthouse", locationKey: "vakeTbilisi", price: 450, guests: 30, bedrooms: 4, baths: 3,
    image: "/images/venues/skyline-penthouse.jpg", images: [], rating: 4.5, reviews: 142, category: "rooftops", isPopular: true },
  { id: 2, nameKey: "gardenVilla", locationKey: "saburtaloTbilisi", price: 680, guests: 50, bedrooms: 5, baths: 3,
    image: "/images/venues/garden-villa.jpg", images: [], rating: 4.5, reviews: 189, category: "villas", isPopular: true },
  { id: 4, nameKey: "loftStudio", locationKey: "veraTbilisi", price: 280, guests: 20, bedrooms: 2, baths: 1,
    image: "/images/venues/loft-studio.jpg", images: [], rating: 4.5, reviews: 98, category: "studios" },
  { id: 5, nameKey: "seasideVilla", locationKey: "batumi", price: 890, guests: 60, bedrooms: 6, baths: 4,
    image: "/images/venues/seaside-villa.jpg", images: [], rating: 4.5, reviews: 156, category: "villas" },
  { id: 6, nameKey: "mountainRetreat", locationKey: "borjomi", price: 520, guests: 35, bedrooms: 5, baths: 2,
    image: "/images/venues/mountain-retreat.jpg", images: [], rating: 4.5, reviews: 67, category: "apartments" },
]

/* ── Card Image Resolver ── */
function CardImage({ venue, resolveLabel }: { venue: Venue; resolveLabel: (k: string) => string }) {
  const [src, setSrc] = useState<string | null>(venue.image.startsWith("firestore://") ? null : venue.image)
  const [loading, setLoading] = useState(venue.image.startsWith("firestore://"))
  useEffect(() => {
    let m = true
    if (venue.image.startsWith("firestore://")) {
      getImageFromFirestore(venue.image.replace("firestore://", ""))
        .then(r => { if (m && r) setSrc(r) })
        .catch(() => {})
        .finally(() => { if (m) setLoading(false) })
    }
    return () => { m = false }
  }, [venue.image])
  const name = resolveLabel(venue.nameKey)
  if (loading) return <div className="w-full h-full bg-[#eaeaea] animate-pulse" />
  return <Image src={src || "/images/venues/default.jpg"} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
}

/* ── Single Card Component ── */
function VenueCard({
  venue, resolveLabel, variant
}: {
  venue: Venue; resolveLabel: (k: string) => string; variant: "featured" | "support"
}) {
  const isFeatured = variant === "featured"

  return (
    <Link href={`/venues/${venue.firestoreId || venue.id}`} className="block h-full group">
      <div className={`ps-card ps-card--${variant} rounded-2xl overflow-hidden relative`}>
        <div className="w-full h-full absolute inset-0">
          <CardImage venue={venue} resolveLabel={resolveLabel} />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/20 to-transparent opacity-75 transition-opacity duration-700 group-hover:opacity-90 pointer-events-none" />

          {/* Rating pill — top left */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-2.5 py-1.5 rounded-[4px] flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-white text-white" />
            <span className="text-xs font-semibold">{venue.rating}</span>
          </div>

          {/* Metadata overlay — bottom left */}
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col gap-1">
            <h3 className={`font-serif tracking-tight text-white leading-tight ${isFeatured ? "text-[2.2rem] lg:text-[2.6rem] mb-1" : "text-[1.4rem] lg:text-[1.6rem]"}`}>
              {resolveLabel(venue.nameKey)}
            </h3>

            <div className={`flex items-center gap-1 text-white/80 font-medium ${isFeatured ? "text-[0.95rem]" : "text-[0.8rem]"}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>{resolveLabel(venue.locationKey)}</span>
            </div>

            <p className={`text-white/60 font-medium mt-1 ${isFeatured ? "text-[0.9rem]" : "text-[0.75rem]"}`}>
              {venue.guests} Guests · {venue.bedrooms || 3} Beds · {venue.baths || 2} Baths · {venue.category.charAt(0).toUpperCase() + venue.category.slice(1)}
            </p>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`font-bold text-white tracking-tight ${isFeatured ? "text-[1.8rem]" : "text-[1.4rem]"}`}>
                ${venue.price}
              </span>
              <span className={`font-bold text-white/50 uppercase tracking-[0.1em] ${isFeatured ? "text-[0.65rem]" : "text-[0.6rem]"}`}>
                /night
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ═══ Main Component ═══ */
export function FeaturedVenues() {
  const { t } = useLanguage()
  const [, startTransition] = useTransition()
  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [allVenues, setAllVenues] = useState(venues)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [mobileIdx, setMobileIdx] = useState(0)
  const cardW = useRef(0)

  const resolveLabel = useCallback(
    (key: string): string => key in t.venueData ? t.venueData[key as keyof typeof t.venueData] : key,
    [t.venueData],
  )

  // Fetch firestore venues
  useEffect(() => {
    let m = true
    ;(async () => {
      try {
        const approved = await getApprovedVenues(12)
        if (!m) return
        const converted: Venue[] = approved.map((fv, i) => ({
          id: i + 1000, nameKey: fv.spaceName, locationKey: fv.location, price: fv.price,
          guests: fv.maxGuests, image: fv.images?.[0] || "/images/venues/default.jpg",
          images: fv.images || [], rating: 4.5, reviews: 0, category: fv.category || "apartments",
          firestoreId: fv.id,
        }))
        startTransition(() => setAllVenues([...venues, ...converted]))
      } catch { /* silent fallback */ }
    })()
    return () => { m = false }
  }, [])

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Compute pages of 3 (1 featured + 2 support)
  const totalPages = Math.ceil(allVenues.length / 3)
  const getTriple = (pageIdx: number) => {
    const n = allVenues.length
    const base = (pageIdx * 3) % n
    return [
      allVenues[base % n],
      allVenues[(base + 1) % n],
      allVenues[(base + 2) % n],
    ]
  }

  const prev = () => setPage(p => (p - 1 + totalPages) % totalPages)
  const next = () => setPage(p => (p + 1) % totalPages)

  const currentTriple = getTriple(page)
  const featured = currentTriple[0]
  const supports = [currentTriple[1], currentTriple[2]]

  // Progress fraction
  const progressFraction = totalPages > 1 ? ((page + 1) / totalPages) * 100 : 100

  // Mobile scroll tracking
  useEffect(() => {
    const el = sliderRef.current; if (!el) return
    const fc = el.firstElementChild as HTMLElement; if (!fc) return
    const gap = parseFloat(getComputedStyle(el).gap) || 16
    cardW.current = fc.offsetWidth + gap
  }, [allVenues, isMobile])

  const onMobileScroll = () => {
    const el = sliderRef.current; if (!el) return
    const idx = Math.round(el.scrollLeft / (cardW.current || 1))
    if (idx !== mobileIdx) setMobileIdx(idx)
  }

  // Editorial statements — no icons
  const statements = [
    "Handpicked venues across Georgia.",
    "Verified hosts and premium spaces.",
    "Instant booking for selected properties.",
  ]

  /* ── Mobile Layout ── */
  if (isMobile) {
    return (
      <section id="venues" className="ps-section">
        <ScrollReveal animation="up" className="w-full">
          <div className="px-5 mb-6">
            <div className="ps-eyebrow">
              <div className="ps-eyebrow__line" />
              <span className="ps-eyebrow__text">Curated Venues</span>
            </div>
            <h2 className="ps-heading" style={{ fontSize: "2.25rem" }}>{t.venues.title}</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div ref={sliderRef} onScroll={onMobileScroll}
              className="flex gap-4 overflow-x-auto pb-4 px-5 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {allVenues.map(v => (
                <div key={v.id} className="w-[82vw] flex-shrink-0 snap-center">
                  <Link href={`/venues/${v.firestoreId || v.id}`}>
                    <div className="ps-mobile-card">
                      <div className="ps-card__img" style={{ aspectRatio: "4/3", height: "auto" }}>
                        <CardImage venue={v} resolveLabel={resolveLabel} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-3 left-3 bg-[#1a1a1c]/65 backdrop-blur-md text-white px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /><span className="text-[11px] font-semibold">{v.rating}</span>
                        </div>
                      </div>
                      <div className="ps-card__body">
                        <h3 className="text-[1.1rem] font-bold text-[#1a1a1c] mb-0.5">{resolveLabel(v.nameKey)}</h3>
                        <div className="flex items-center gap-1 text-[#1a1a1c]/35 text-[0.75rem] font-medium">
                          <MapPin className="w-3 h-3" /><span>{resolveLabel(v.locationKey)}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-[1.3rem] font-bold text-[#1a1a1c]">${v.price}</span>
                          <span className="text-[0.6rem] font-bold text-[#1a1a1c]/25 uppercase tracking-widest">/night</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Mobile dots */}
            <div className="flex justify-center gap-2 mt-1">
              {allVenues.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === mobileIdx ? "w-8 bg-[#1a1a1c]" : "w-2 bg-[#1a1a1c]/15"}`} />
              ))}
            </div>

            {/* Mobile statements */}
            <div className="px-5 mt-4">
              <div className="ps-statements">
                {statements.map((s, i) => (
                  <p key={i} className="ps-statement">{s}</p>
                ))}
              </div>
              <Link href="/browse" className="ps-cta">
                <span>Browse all venues</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    )
  }

  /* ── Desktop Layout — Asymmetric Bento ── */
  return (
    <section id="venues" className="ps-section">
      <ScrollReveal animation="up" className="w-full relative z-10">
        <div className="ps-split">

          {/* LEFT — Bento Cards */}
          <div className="ps-left flex flex-col">
            <div className="relative w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  className="ps-bento"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Featured card — spans full height left */}
                  <div className="ps-bento__featured">
                    <VenueCard venue={featured} resolveLabel={resolveLabel} variant="featured" />
                  </div>

                  {/* Two supporting cards — stacked right */}
                  {supports.map((v) => (
                    <div key={v.id} className="ps-bento__support">
                      <VenueCard venue={v} resolveLabel={resolveLabel} variant="support" />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Dashed slider indicator under the featured card explicitly */}
            <div className="flex items-center justify-center gap-3 mt-6 w-full lg:w-[60%]">
              {[...Array(totalPages)].map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === page ? "w-8 bg-[#1a1a1c]" : "w-6 bg-[#1a1a1c]/10"}`} />
              ))}
            </div>
          </div>

          {/* RIGHT — Editorial Content */}
          <div className="ps-right lg:pl-4">
            <ScrollReveal animation="up" delay={0.1}>
              {/* Eyebrow */}
              <div className="ps-eyebrow lg:mb-1.5 xl:mb-4">
                <span className="ps-eyebrow__text tracking-[0.2em] font-bold text-black/40 text-[10px]">CURATED VENUES</span>
              </div>

              {/* Heading */}
              <h2 className="font-bold text-[3.5rem] lg:text-[2.6rem] xl:text-[5.5rem] leading-[0.95] tracking-tighter text-[#1a1a1c] lg:mb-1.5 xl:mb-6">
                Popular<br/>Venues
              </h2>
              
              {/* Divider */}
              <div className="w-[85%] h-[1px] bg-black/10 lg:mb-2 xl:mb-6" />

              {/* Editorial statements */}
              <div className="ps-statements lg:mb-3 xl:mb-8">
                <p className="text-[1.05rem] lg:text-[0.85rem] xl:text-[1.1rem] text-black/50 font-medium leading-relaxed max-w-[90%]">
                  Handpicked venues across Georgia.<br/>
                  Verified hosts, premium spaces,<br/>
                  memorable experiences.
                </p>
              </div>

              {/* CTA */}
              <Link href="/browse" className="inline-flex items-center gap-2 text-[#1a1a1c] font-bold text-[1.05rem] lg:text-[0.85rem] xl:text-[1.1rem] group lg:mb-3 xl:mb-12">
                <span className="border-b-[1.5px] border-[#1a1a1c] pb-0.5">Explore all venues</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </ScrollReveal>

            {/* Pagination Controls - Premium Minimal Restraint */}
            <div className="flex items-center justify-start gap-5 lg:mt-2">
              <div className="flex items-center gap-1">
                <button onClick={prev} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all text-black/30 hover:text-black/80 group" aria-label="Previous">
                  <ChevronLeft className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
                </button>
                <button onClick={next} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all text-black/30 hover:text-black/80 group" aria-label="Next">
                  <ChevronRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="w-px h-[10px] bg-black/10" />

              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] select-none">
                <span className="text-[#1a1a1c]">{String(page + 1).padStart(2, "0")}</span>
                <span className="text-black/20">/</span>
                <span className="text-black/40">{String(totalPages).padStart(2, "0")}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Statements Row */}
        <div className="hidden lg:grid grid-cols-3 max-w-[1100px] mx-auto mt-16 pt-8 border-t border-black/5 relative z-10 text-center gap-8 group cursor-default">
          <div className="relative px-4 transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]">
            <p className="text-[1rem] font-medium text-[#1a1a1c] opacity-40 group-hover:opacity-90 transition-opacity duration-[220ms] ease-out leading-relaxed">
              Handpicked venues<br/>across Georgia.
            </p>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[1px] h-12 bg-[#1a1a1c] opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-[220ms] ease-out" />
          </div>
          <div className="relative px-4 transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]">
            <p className="text-[1rem] font-medium text-[#1a1a1c] opacity-40 group-hover:opacity-90 transition-opacity duration-[220ms] ease-out leading-relaxed">
              Verified hosts and<br/>premium spaces.
            </p>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[1px] h-12 bg-[#1a1a1c] opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-[220ms] ease-out" />
          </div>
          <div className="px-4 transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]">
            <p className="text-[1rem] font-medium text-[#1a1a1c] opacity-40 group-hover:opacity-90 transition-opacity duration-[220ms] ease-out leading-relaxed">
              Instant booking for<br/>selected properties.
            </p>
          </div>

        </div>
      </ScrollReveal>
    </section>
  )
}
