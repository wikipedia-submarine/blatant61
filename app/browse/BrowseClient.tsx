'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Users, Search, ChevronDown, Check, SlidersHorizontal, ChevronRight, ChevronLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getApprovedVenues } from "@/lib/firestore-venues"
import { BrowseVenueCard, BrowseVenueCardSkeleton } from "@/components/browseVenueCard"

type VenueCategory = "all" | "apartments" | "villas" | "rooftops" | "studios"

interface Venue {
  id: number
  nameKey: string
  locationKey: string
  price: number
  guests: number
  image: string
  images: string[]
  description: string
  amenities: string[]
  location: string
  premium?: boolean
  category?: Exclude<VenueCategory, "all">
  firestoreId?: string
}

interface Props {
  venuesData: Venue[]
}

const categories: { value: VenueCategory; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "apartments", label: "Apartments" },
  { value: "villas", label: "Villas" },
  { value: "rooftops", label: "Rooftops" },
  { value: "studios", label: "Studios" },
]

const venueTypes = ["All Types", "Indoor", "Outdoor", "Mixed"]
const ITEMS_PER_PAGE = 12

export default function BrowseClient({ venuesData }: Props) {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [allVenues, setAllVenues] = useState(venuesData)
  const [filtered, setFiltered] = useState(venuesData)
  const [activeCategory, setActiveCategory] = useState<VenueCategory>("all")
  const [activeCity, setActiveCity] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)

  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [activeType, setActiveType] = useState("All Types")

  const categoryRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setCategoryOpen(false)
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) setTypeOpen(false)
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sync active city from URL
  useEffect(() => {
    const locationParam = searchParams.get("location")
    if (locationParam) {
      setActiveCity(locationParam)
    }
  }, [searchParams])

  // Load approved venues from Firestore on mount
  useEffect(() => {
    let isMounted = true

    const loadFirestoreVenues = async () => {
      if (typeof window === 'undefined') return

      try {
        setIsLoading(true)
        const approvedVenues = await getApprovedVenues()

        if (!isMounted) return

        const convertedVenues: Venue[] = approvedVenues.map((venueData, idx) => {
          return {
            id: idx + 1000,
            nameKey: venueData.spaceName,
            locationKey: venueData.location,
            price: venueData.price,
            guests: venueData.maxGuests,
            image: venueData.images?.[0] || "/images/venues/default.jpg",
            images: venueData.images || [],
            description: venueData.description,
            amenities: venueData.amenities,
            location: venueData.location,
            premium: false,
            category: (venueData.category as any) || "apartments",
            firestoreId: venueData.id,
          }
        })

        if (!isMounted) return
        setAllVenues([...venuesData, ...convertedVenues])
        setIsLoading(false)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        if (!isMounted) return
        console.warn("Failed to load venues from Firestore:", error)
        setIsLoading(false)
      }
    }

    loadFirestoreVenues()

    return () => {
      isMounted = false
    }
  }, [venuesData])

  useEffect(() => {
    const location = searchParams.get("location")
    const guests = searchParams.get("guests")

    let result = allVenues

    if (location) {
      result = result.filter((v) => v.location === location)
    }

    if (guests) {
      const minGuests = { "1-10": 1, "11-25": 11, "26-50": 26 }[guests] || 50
      result = result.filter((v) => v.guests >= minGuests)
    }

    if (activeCategory !== "all") {
      result = result.filter((v) => v.category === activeCategory)
    }

    if (activeCity !== "all") {
      result = result.filter((v) => v.location === activeCity)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (v) =>
          v.nameKey.toLowerCase().includes(q) ||
          v.locationKey.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (sortBy === "guests") {
      result = [...result].sort((a, b) => b.guests - a.guests)
    }

    setFiltered(result)
    setCurrentPage(1)
  }, [searchParams, allVenues, activeCategory, activeCity, searchQuery, sortBy])

  const resolveVenueLabel = (key: string): string =>
    key in t.venueData ? t.venueData[key as keyof typeof t.venueData] : key

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedVenues = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (currentPage > 4) pages.push("...")
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage)
      if (currentPage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return [...new Set(pages)]
  }

  return (
    <div className="min-h-screen pt-[72px] md:pt-[88px]">
      {/* ============================================ */}
      {/* HERO BANNER                                  */}
      {/* ============================================ */}
      <section className="relative w-full h-[320px] md:h-[420px] lg:h-[480px] overflow-hidden">
        {/* Banner Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/browse.png')" }}
        />
        {/* Left gradient fade for text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#F5F7FB] via-[#F5F7FB]/80 to-transparent w-[75%] md:w-[55%]" />
        {/* Bottom fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 z-[1] h-24 bg-gradient-to-t from-[#F5F7FB] to-transparent" />

        {/* Text Content */}
        <div className="relative z-10 w-full max-w-[1320px] mx-auto px-6 md:px-12 h-full flex flex-col justify-end pb-16 md:pb-20">
          <h1 className="text-[#111111] font-bold text-[2.5rem] md:text-[3.2rem] leading-[1.1] tracking-tight mb-3">
            Find the perfect space
          </h1>
          <p className="text-[#111111]/60 font-medium text-[15px] md:text-base max-w-[380px] leading-relaxed">
            Explore unique venues for any occasion.<br />
            Book in minutes.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FILTER BAR                                   */}
      {/* ============================================ */}
      <div className="sticky top-[60px] md:top-[74px] z-40 w-full max-w-[1320px] mx-auto px-6 md:px-12 -mt-6 pb-4 transition-all duration-300">
        <div className="w-full bg-white rounded-[24px] shadow-[0_8px_40px_rgba(107,122,144,0.08)] hover:shadow-[0_8px_40px_rgba(107,122,144,0.12)] transition-shadow duration-300 border border-[#E7ECF3] px-5 py-4 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2.5 bg-[#F8FAFC] rounded-[14px] px-4 py-2.5 min-w-[200px] flex-1 md:flex-none md:w-[220px] border border-[#E7ECF3]/60">
            <Search className="w-4 h-4 text-[#6B7A90]" />
            <input
              type="text"
              placeholder="Search venues, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-[#111111] placeholder:text-[#6B7A90]/60 outline-none w-full"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative" ref={categoryRef}>
            <button
              onClick={() => { setCategoryOpen(!categoryOpen); setTypeOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111111] bg-[#F8FAFC] hover:bg-[#EEF2F7] transition-colors border border-[#E7ECF3]/60 cursor-pointer"
            >
              {categories.find(c => c.value === activeCategory)?.label}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7A90] transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(107,122,144,0.12)] border border-[#E7ECF3] overflow-hidden z-50">
                <div className="py-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setActiveCategory(cat.value); setCategoryOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#111111]/80 hover:bg-[#F8FAFC] transition-colors text-left"
                    >
                      <span>{cat.label}</span>
                      {activeCategory === cat.value && <Check className="w-3.5 h-3.5 text-[#111111]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Type Dropdown */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => { setTypeOpen(!typeOpen); setCategoryOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111111] bg-[#F8FAFC] hover:bg-[#EEF2F7] transition-colors border border-[#E7ECF3]/60 cursor-pointer"
            >
              {activeType}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7A90] transition-transform duration-200 ${typeOpen ? "rotate-180" : ""}`} />
            </button>
            {typeOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(107,122,144,0.12)] border border-[#E7ECF3] overflow-hidden z-50">
                <div className="py-1.5">
                  {venueTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => { setActiveType(type); setTypeOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#111111]/80 hover:bg-[#F8FAFC] transition-colors text-left"
                    >
                      <span>{type}</span>
                      {activeType === type && <Check className="w-3.5 h-3.5 text-[#111111]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Guests */}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111111] bg-[#F8FAFC] hover:bg-[#EEF2F7] transition-colors border border-[#E7ECF3]/60 cursor-pointer">
            <Users className="w-3.5 h-3.5 text-[#6B7A90]" />
            Guests
          </button>

          {/* Price */}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111111] bg-[#F8FAFC] hover:bg-[#EEF2F7] transition-colors border border-[#E7ECF3]/60 cursor-pointer">
            Price
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7A90]" />
          </button>

          {/* More Filters */}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#6B7A90] bg-[#F8FAFC] hover:bg-[#EEF2F7] transition-colors border border-[#E7ECF3]/60 cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            More filters
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort + Grid toggle */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setSortOpen(!sortOpen); setCategoryOpen(false); setTypeOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111111] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                Sort by: <span className="text-[#111111]">{sortBy === "popular" ? "Popular" : sortBy === "price-low" ? "Price ↑" : sortBy === "price-high" ? "Price ↓" : "Guests"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B7A90] transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(107,122,144,0.12)] border border-[#E7ECF3] overflow-hidden z-50">
                  <div className="py-1.5">
                    {[
                      { value: "popular", label: "Popular" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "price-high", label: "Price: High to Low" },
                      { value: "guests", label: "Most Guests" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#111111]/80 hover:bg-[#F8FAFC] transition-colors text-left"
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#111111]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Grid icon */}
            <button className="w-10 h-10 rounded-[14px] border border-[#E7ECF3] flex items-center justify-center hover:bg-[#F8FAFC] transition-colors cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="#111111" strokeWidth="1.5"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="#111111" strokeWidth="1.5"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="#111111" strokeWidth="1.5"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="#111111" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* RESULTS COUNT                                */}
      {/* ============================================ */}
      <div className="w-full max-w-[1320px] mx-auto px-6 md:px-12 mt-8 mb-6">
        <p className="text-[14px] font-medium text-[#6B7A90]">
          {filtered.length} venues found
        </p>
      </div>

      {/* ============================================ */}
      {/* VENUE CARDS GRID                             */}
      {/* ============================================ */}
      <div className="w-full max-w-[1320px] mx-auto px-6 md:px-12 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-[#6B7A90] mb-6">
              No venues match your search criteria
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white rounded-[14px] font-semibold text-[14px] hover:bg-black transition-colors">
              Try different filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <BrowseVenueCardSkeleton key={i} />
              ))
            ) : (
              paginatedVenues.map((venue) => (
                <BrowseVenueCard
                  key={venue.id}
                  venue={venue}
                  resolveLabel={resolveVenueLabel}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* PAGINATION                                   */}
      {/* ============================================ */}
      {totalPages > 1 && (
        <div className="w-full max-w-[1320px] mx-auto px-6 md:px-12 pb-16 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-[12px] border border-[#E7ECF3] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#111111]" />
          </button>

          {getPageNumbers().map((page, idx) =>
            typeof page === "string" ? (
              <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-[13px] text-[#6B7A90]">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-[12px] text-[13px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === page
                    ? "bg-[#111111] text-white shadow-[0_4px_12px_rgba(17,17,17,0.15)]"
                    : "text-[#111111] hover:bg-white border border-[#E7ECF3]"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-[12px] border border-[#E7ECF3] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#111111]" />
          </button>
        </div>
      )}
    </div>
  )
}
