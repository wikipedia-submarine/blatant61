'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { 
  Users, Search, ChevronDown, Check, SlidersHorizontal, 
  ChevronRight, ChevronLeft, MapPin, Heart, X, 
  LayoutGrid, List, ChevronUp, Wifi, Car, Waves
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getApprovedVenues } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type VenueCategory = "all" | "apartments" | "villas" | "rooftops" | "studios" | "modern" | "outdoor" | "event" | "unique"

interface Venue {
  id: number
  nameKey: string
  locationKey: string
  price: number
  guests: number
  sqm: number
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

const categories: { value: VenueCategory; label: string; count: number }[] = [
  { value: "all", label: "All Categories", count: 120 },
  { value: "rooftops", label: "Rooftops", count: 32 },
  { value: "villas", label: "Villas", count: 48 },
  { value: "modern", label: "Modern Spaces", count: 34 },
  { value: "outdoor", label: "Outdoor Spaces", count: 36 },
  { value: "event", label: "Event Halls", count: 28 },
  { value: "unique", label: "Unique Stays", count: 21 },
]

const capacityOptions = [
  { value: "0-20", label: "Up to 20 guests" },
  { value: "20-50", label: "20 - 50 guests" },
  { value: "50-100", label: "50 - 100 guests" },
  { value: "100+", label: "100+ guests" },
]

const amenitiesOptions = [
  { value: "pool", label: "Pool", icon: Waves },
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "parking", label: "Parking", icon: Car },
]

const ITEMS_PER_PAGE = 12

// Individual Venue Card matching the reference design
function VenueCard({ 
  venue, 
  resolveLabel 
}: { 
  venue: Venue
  resolveLabel: (key: string) => string 
}) {
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
    <div className="group relative bg-white rounded-[16px] overflow-hidden border border-[rgba(74,95,127,0.08)] hover:shadow-[0_16px_48px_rgba(74,95,127,0.12)] hover:-translate-y-1.5 transition-all duration-[250ms] cursor-pointer">
      <Link href={`/venues/${detailPageId}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F9FC]">
          {imageLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <Image
              src={resolvedImage || "/images/venues/default.jpg"}
              alt={venueName}
              fill
              className="object-cover group-hover:scale-[1.04] transition-transform duration-[250ms] ease-out"
              loading="lazy"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          )}

          {/* Premium Badge */}
          {venue.premium && (
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="bg-[#3B4E69] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">
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
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            <Heart
              className={`w-4.5 h-4.5 transition-colors ${
                isFavorited ? "fill-[#4A5F7F] text-[#4A5F7F]" : "text-[#6B7280]"
              }`}
            />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-[16px] font-bold text-[#111827] mb-2 truncate leading-snug">
            {venueName}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-[#6B7280] mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium truncate">
              {venueLocation}
            </span>
          </div>

          {/* Guests + Sqm Row */}
          <div className="flex items-center gap-4 text-[#6B7280] mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[12px] font-medium">
                Up to {venue.guests} guests
              </span>
            </div>
            <span className="text-[12px] text-[#6B7280]/60">•</span>
            <span className="text-[12px] font-medium">
              {venue.sqm || Math.floor(venue.guests * 8)} m²
            </span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-[20px] font-bold text-[#111827]">${venue.price}</span>
            <span className="text-[12px] text-[#6B7280] font-medium ml-1">/night</span>
          </div>

          {/* View Details Row - with separator */}
          <div className="pt-3 border-t border-[rgba(74,95,127,0.08)]">
            <span className="text-[13px] font-semibold text-[#4A5F7F] flex items-center gap-1 group-hover:gap-2 transition-all">
              View details
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

function VenueCardSkeleton() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[rgba(74,95,127,0.08)]">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between items-center pt-3 border-t border-[rgba(74,95,127,0.08)]">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  )
}

// Filter Sidebar Component
function FilterSidebar({ 
  activeCategory, 
  setActiveCategory,
  priceRange,
  setPriceRange,
  selectedCapacity,
  setSelectedCapacity,
  selectedAmenities,
  setSelectedAmenities,
  className = ""
}: {
  activeCategory: VenueCategory
  setActiveCategory: (cat: VenueCategory) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  selectedCapacity: string[]
  setSelectedCapacity: (caps: string[]) => void
  selectedAmenities: string[]
  setSelectedAmenities: (ams: string[]) => void
  className?: string
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [capacityOpen, setCapacityOpen] = useState(true)
  const [amenitiesOpen, setAmenitiesOpen] = useState(true)

  return (
    <div className={`bg-[#F7F9FC] rounded-[16px] border border-[rgba(74,95,127,0.08)] p-6 ${className}`}>
      {/* Categories Section */}
      <div className="mb-6">
        <button 
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between mb-4 cursor-pointer"
        >
          <h3 className="text-[14px] font-bold text-[#111827]">Categories</h3>
          {categoriesOpen ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
        
        {categoriesOpen && (
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.value 
                    ? "bg-[#3B4E69]/15 text-[#3B4E69]" 
                    : "text-[#6B7280] hover:bg-white/50"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[12px] ${activeCategory === cat.value ? "text-[#3B4E69]/70" : "text-[#6B7280]/60"}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="mb-6">
        <button 
          onClick={() => setPriceOpen(!priceOpen)}
          className="w-full flex items-center justify-between mb-4 cursor-pointer"
        >
          <h3 className="text-[14px] font-bold text-[#111827]">Price Range</h3>
          {priceOpen ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
        
        {priceOpen && (
          <div>
            <div className="relative h-2 bg-[#E5E7EB] rounded-full mb-4">
              <div 
                className="absolute h-full bg-[#4A5F7F] rounded-full"
                style={{ 
                  left: `${(priceRange[0] / 2000) * 100}%`, 
                  width: `${((priceRange[1] - priceRange[0]) / 2000) * 100}%` 
                }}
              />
              <input
                type="range"
                min="0"
                max="2000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
              <span>$0</span>
              <span>$2,000+</span>
            </div>
          </div>
        )}
      </div>

      {/* Capacity Section */}
      <div className="mb-6">
        <button 
          onClick={() => setCapacityOpen(!capacityOpen)}
          className="w-full flex items-center justify-between mb-4 cursor-pointer"
        >
          <h3 className="text-[14px] font-bold text-[#111827]">Capacity</h3>
          {capacityOpen ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
        
        {capacityOpen && (
          <div className="space-y-2">
            {capacityOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  selectedCapacity.includes(opt.value) 
                    ? "bg-[#4A5F7F] border-[#4A5F7F]" 
                    : "border-[#D1D5DB] group-hover:border-[#9CA3AF]"
                }`}>
                  {selectedCapacity.includes(opt.value) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-[13px] text-[#6B7280] group-hover:text-[#111827] transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities Section */}
      <div>
        <button 
          onClick={() => setAmenitiesOpen(!amenitiesOpen)}
          className="w-full flex items-center justify-between mb-4 cursor-pointer"
        >
          <h3 className="text-[14px] font-bold text-[#111827]">Amenities</h3>
          {amenitiesOpen ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>
        
        {amenitiesOpen && (
          <div className="space-y-2">
            {amenitiesOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  selectedAmenities.includes(opt.value) 
                    ? "bg-[#4A5F7F] border-[#4A5F7F]" 
                    : "border-[#D1D5DB] group-hover:border-[#9CA3AF]"
                }`}>
                  {selectedAmenities.includes(opt.value) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-[13px] text-[#6B7280] group-hover:text-[#111827] transition-colors flex items-center gap-2">
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowseClient({ venuesData }: Props) {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  
  // Add sqm to venues data - memoized to prevent infinite re-renders
  const venuesWithSqm = useMemo(() => venuesData.map(v => ({
    ...v,
    sqm: v.sqm || Math.floor(v.guests * 8 + Math.random() * 50)
  })), [venuesData])
  
  const [allVenues, setAllVenues] = useState(venuesWithSqm)
  const [filtered, setFiltered] = useState(venuesWithSqm)
  const [activeCategory, setActiveCategory] = useState<VenueCategory>("all")
  const [activeCity, setActiveCity] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000])
  const [selectedCapacity, setSelectedCapacity] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  
  // Dropdown states
  const [locationOpen, setLocationOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const locationRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const guestsRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  const locations = ["All Locations", "Tbilisi", "Batumi", "Borjomi", "Kazbegi", "Mtskheta", "Kojori"]

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) setLocationOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setCategoryOpen(false)
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) setDateOpen(false)
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) setGuestsOpen(false)
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
            sqm: Math.floor(venueData.maxGuests * 8 + Math.random() * 50),
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
        setAllVenues([...venuesWithSqm, ...convertedVenues])
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
  }, [venuesWithSqm])

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

    if (activeCity !== "all" && activeCity !== "All Locations") {
      result = result.filter((v) => v.location.includes(activeCity))
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

    // Price filter
    result = result.filter(v => v.price >= priceRange[0] && v.price <= priceRange[1])

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
  }, [searchParams, allVenues, activeCategory, activeCity, searchQuery, sortBy, priceRange])

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

  const toggleCapacity = (cap: string) => {
    setSelectedCapacity(prev => 
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    )
  }

  const toggleAmenity = (am: string) => {
    setSelectedAmenities(prev => 
      prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am]
    )
  }

  return (
    <div className="min-h-screen bg-[#EEF3F8]">
      {/* ============================================ */}
      {/* HERO BANNER                                  */}
      {/* ============================================ */}
      <section className="relative w-full h-[380px] md:h-[440px] lg:h-[500px] overflow-hidden">
        {/* Banner Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/browsebanner.png')" }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
        {/* Bottom fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 z-[1] h-32 bg-gradient-to-t from-[#EEF3F8] to-transparent" />

        {/* Breadcrumb + Text Content */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 h-full flex flex-col justify-center pt-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 text-[13px] font-medium mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Browse Venues</span>
          </div>
          
          <h1 className="text-white font-bold text-[2.8rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-tight mb-4">
            Browse <span className="italic font-serif font-normal bg-gradient-to-r from-[#2A3B52] to-[#4A6182] bg-clip-text text-transparent">venues</span>
          </h1>
          <p className="text-white/80 font-medium text-[15px] md:text-[16px] max-w-[480px] leading-relaxed">
            Explore handpicked venues for any occasion.<br />
            Book the perfect space in minutes.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FLOATING SEARCH BAR                          */}
      {/* ============================================ */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-12 -mt-10">
        <div className="bg-white rounded-[20px] border border-[rgba(74,95,127,0.08)] px-4 md:px-6 py-4 flex items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2.5 bg-[#F7F9FC] rounded-[14px] px-4 py-3 min-w-[180px] md:min-w-[220px] border border-[rgba(74,95,127,0.06)]">
            <Search className="w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search venues, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-[#111827] placeholder:text-[#6B7280]/60 outline-none w-full"
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative hidden md:block" ref={locationRef}>
            <button
              onClick={() => { setLocationOpen(!locationOpen); setCategoryOpen(false); setDateOpen(false); setGuestsOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-[14px] text-[13px] font-semibold text-[#111827] bg-[#F7F9FC] hover:bg-[#EEF3F8] transition-colors border border-[rgba(74,95,127,0.06)] cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#6B7280]" />
              {activeCity === "all" ? "All Locations" : activeCity}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${locationOpen ? "rotate-180" : ""}`} />
            </button>
            {locationOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(74,95,127,0.15)] border border-[rgba(74,95,127,0.08)] overflow-hidden z-50">
                <div className="py-1.5">
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setActiveCity(loc === "All Locations" ? "all" : loc); setLocationOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#6B7280] hover:bg-[#F7F9FC] hover:text-[#111827] transition-colors text-left cursor-pointer"
                    >
                      <span>{loc}</span>
                      {(activeCity === loc || (loc === "All Locations" && activeCity === "all")) && <Check className="w-3.5 h-3.5 text-[#4A5F7F]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative hidden md:block" ref={categoryRef}>
            <button
              onClick={() => { setCategoryOpen(!categoryOpen); setLocationOpen(false); setDateOpen(false); setGuestsOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-[14px] text-[13px] font-semibold text-[#111827] bg-[#F7F9FC] hover:bg-[#EEF3F8] transition-colors border border-[rgba(74,95,127,0.06)] cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-[#6B7280]" />
              {categories.find(c => c.value === activeCategory)?.label || "All Categories"}
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(74,95,127,0.15)] border border-[rgba(74,95,127,0.08)] overflow-hidden z-50">
                <div className="py-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setActiveCategory(cat.value); setCategoryOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#6B7280] hover:bg-[#F7F9FC] hover:text-[#111827] transition-colors text-left cursor-pointer"
                    >
                      <span>{cat.label}</span>
                      {activeCategory === cat.value && <Check className="w-3.5 h-3.5 text-[#4A5F7F]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Dropdown */}
          <div className="relative hidden lg:block" ref={dateRef}>
            <button
              onClick={() => { setDateOpen(!dateOpen); setLocationOpen(false); setCategoryOpen(false); setGuestsOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-[14px] text-[13px] font-semibold text-[#111827] bg-[#F7F9FC] hover:bg-[#EEF3F8] transition-colors border border-[rgba(74,95,127,0.06)] cursor-pointer"
            >
              Any Date
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${dateOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Guests Dropdown */}
          <div className="relative hidden lg:block" ref={guestsRef}>
            <button
              onClick={() => { setGuestsOpen(!guestsOpen); setLocationOpen(false); setCategoryOpen(false); setDateOpen(false); setSortOpen(false); }}
              className="flex items-center gap-2 px-4 py-3 rounded-[14px] text-[13px] font-semibold text-[#111827] bg-[#F7F9FC] hover:bg-[#EEF3F8] transition-colors border border-[rgba(74,95,127,0.06)] cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#6B7280]" />
              Any Guests
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${guestsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* More Filters */}
          <button 
            onClick={() => setMobileFiltersOpen(true)}
            className="hidden xl:flex items-center gap-2 px-4 py-3 rounded-[14px] text-[13px] font-semibold text-[#6B7280] bg-[#F7F9FC] hover:bg-[#EEF3F8] transition-colors border border-[rgba(74,95,127,0.06)] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            More filters
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort + View toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B7280] font-medium hidden xl:inline">Sort by:</span>
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setSortOpen(!sortOpen); setLocationOpen(false); setCategoryOpen(false); setDateOpen(false); setGuestsOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-[14px] text-[13px] font-semibold text-[#111827] hover:bg-[#F7F9FC] transition-colors cursor-pointer"
              >
                {sortBy === "popular" ? "Popular" : sortBy === "price-low" ? "Price: Low" : sortBy === "price-high" ? "Price: High" : "Guests"}
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-[16px] shadow-[0_16px_48px_rgba(74,95,127,0.15)] border border-[rgba(74,95,127,0.08)] overflow-hidden z-50">
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
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#6B7280] hover:bg-[#F7F9FC] hover:text-[#111827] transition-colors text-left cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#4A5F7F]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* View toggle buttons */}
            <div className="hidden md:flex items-center border border-[rgba(74,95,127,0.08)] rounded-[14px] overflow-hidden">
              <button 
                onClick={() => setViewMode("grid")}
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${viewMode === "grid" ? "bg-[#3B4E69] text-white" : "bg-white text-[#6B7280] hover:bg-[#F7F9FC]"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${viewMode === "list" ? "bg-[#3B4E69] text-white" : "bg-white text-[#6B7280] hover:bg-[#F7F9FC]"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT: SIDEBAR + RESULTS              */}
      {/* ============================================ */}
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-8 md:py-12">
        <div className="flex gap-8">
          {/* Left Sidebar - Hidden on mobile/tablet */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-[120px]">
              <FilterSidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedCapacity={selectedCapacity}
                setSelectedCapacity={(caps) => setSelectedCapacity(caps)}
                selectedAmenities={selectedAmenities}
                setSelectedAmenities={(ams) => setSelectedAmenities(ams)}
              />
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-[14px] font-medium text-[#6B7280]">
                {filtered.length} venues found
              </p>
            </div>

            {/* Venue Cards Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[16px] border border-[rgba(74,95,127,0.08)]">
                <p className="text-lg text-[#6B7280] mb-6">
                  No venues match your search criteria
                </p>
                <button 
                  onClick={() => {
                    setActiveCategory("all")
                    setActiveCity("all")
                    setSearchQuery("")
                    setPriceRange([0, 2000])
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#111827] text-white rounded-[14px] font-semibold text-[14px] hover:bg-black transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"}`}>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <VenueCardSkeleton key={i} />
                  ))
                ) : (
                  paginatedVenues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      resolveLabel={resolveVenueLabel}
                    />
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-[12px] border border-[rgba(74,95,127,0.08)] bg-white flex items-center justify-center hover:bg-[#F7F9FC] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#111827]" />
                </button>

                {getPageNumbers().map((page, idx) =>
                  typeof page === "string" ? (
                    <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-[13px] text-[#6B7280]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-[12px] text-[13px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                        currentPage === page
                          ? "bg-[#4A5F7F] text-white shadow-[0_4px_12px_rgba(74,95,127,0.2)]"
                          : "text-[#111827] bg-white hover:bg-[#F7F9FC] border border-[rgba(74,95,127,0.08)]"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-[12px] border border-[rgba(74,95,127,0.08)] bg-white flex items-center justify-center hover:bg-[#F7F9FC] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#111827]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0 bg-[#EEF3F8]">
          <SheetHeader className="p-5 border-b border-[rgba(74,95,127,0.08)] bg-white">
            <SheetTitle className="text-[16px] font-bold text-[#111827]">Filters</SheetTitle>
          </SheetHeader>
          <div className="p-5 overflow-y-auto h-[calc(100vh-80px)]">
            <FilterSidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedCapacity={selectedCapacity}
              setSelectedCapacity={(caps) => setSelectedCapacity(caps)}
              selectedAmenities={selectedAmenities}
              setSelectedAmenities={(ams) => setSelectedAmenities(ams)}
              className="bg-white"
            />
            <button 
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full mt-6 py-3.5 bg-[#4A5F7F] text-white rounded-[14px] font-semibold text-[14px] hover:bg-[#3B4E69] transition-colors cursor-pointer"
            >
              Show {filtered.length} results
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
