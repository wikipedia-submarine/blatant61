"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, Home, Search, ChevronDown, Check, LayoutGrid, Building2, TreePalm, Sunset, Clapperboard } from "lucide-react"
import { motion } from "framer-motion"

export function HeroSection() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedGuests, setSelectedGuests] = useState("")
  const [activeField, setActiveField] = useState<string | null>(null)

  const categoryRef = useRef<HTMLDivElement>(null)
  const guestsRef = useRef<HTMLDivElement>(null)

  const categoryIcons: Record<string, React.ReactNode> = {
    all: <LayoutGrid className="w-4 h-4 text-white/70" />,
    apartments: <Building2 className="w-4 h-4 text-white/70" />,
    villas: <TreePalm className="w-4 h-4 text-white/70" />,
    rooftops: <Sunset className="w-4 h-4 text-white/70" />,
    studios: <Clapperboard className="w-4 h-4 text-white/70" />,
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "apartments", label: "Apartments" },
    { value: "villas", label: "Villas" },
    { value: "rooftops", label: "Rooftops" },
    { value: "studios", label: "Studios" },
  ]

  const guestOptions = [
    { value: "", label: "Any size", sub: "No limit" },
    { value: "1-10", label: "1 – 10", sub: "Intimate" },
    { value: "11-25", label: "11 – 25", sub: "Small group" },
    { value: "26-50", label: "26 – 50", sub: "Medium" },
    { value: "50+", label: "50+", sub: "Large event" },
  ]

  useEffect(() => {
    setMounted(true)
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryOpen(false)
        if (activeField === "category") setActiveField(null)
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setGuestsOpen(false)
        if (activeField === "guests") setActiveField(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activeField])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    if (selectedGuests) params.set("guests", selectedGuests)
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`)
  }



  return (
    <section className="relative w-full h-[580px] md:h-[640px] lg:h-[700px] min-[1440px]:h-[780px] min-[1700px]:h-[900px] overflow-visible bg-transparent z-[20]">
      <div 
        className="absolute inset-0 z-1 bg-no-repeat bg-cover w-full h-full bg-[position:65%_center] md:bg-[position:75%_center] lg:bg-[position:85%_center] min-[1440px]:bg-right pointer-events-none" 
        style={{ backgroundImage: "url('/images/2.png')" }} 
      />

      <div className="relative z-10 w-full max-w-[1400px] min-[1440px]:max-w-[1500px] min-[1700px]:max-w-[1650px] mx-auto h-full flex flex-col items-center justify-center px-6 md:px-12 pt-20 min-[1440px]:pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center max-w-[900px] w-full"
        >

          <h1 className="text-[#EEF3F8] font-bold text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[5.5rem] leading-[1.05] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            Discover exceptional<br className="hidden sm:block" /> spaces in <span className="text-[#EEF3F8] italic font-serif font-light tracking-normal">Georgia</span>
          </h1>
        </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 16, x: "-50%" }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-1/2 w-[calc(100%-3rem)] md:w-full max-w-[680px] z-30"
          >
            <div className="flex items-stretch bg-[#EEF3F8] rounded-t-[24px] rounded-b-none p-2 shadow-[0_-8px_24px_rgba(107,122,144,0.08)] relative">
              {/* Left Curve Connection */}
              <svg className="absolute -left-[24px] bottom-0 w-[24px] h-[24px] pointer-events-none hidden md:block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 0V24H0C13.2548 24 24 13.2548 24 0Z" fill="#EEF3F8" />
              </svg>
              {/* Right Curve Connection */}
              <svg className="absolute -right-[24px] bottom-0 w-[24px] h-[24px] pointer-events-none hidden md:block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0V24H24C10.7452 24 0 13.2548 0 0Z" fill="#EEF3F8" />
              </svg>
              
              {/* Date Field */}
              <div 
                className={`flex-1 flex items-center gap-3 px-5 py-4 cursor-pointer rounded-xl transition-colors duration-200 relative ${activeField === "date" ? "bg-[#F5F7FB]" : "hover:bg-[#F5F7FB]/60"}`}
                onClick={() => setActiveField(activeField === "date" ? null : "date")}
              >
                <Calendar className={`w-4 h-4 flex-shrink-0 ${activeField === "date" ? "text-[#1a1a1c]" : "text-[#6B7A90]"}`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B7A90] leading-none mb-1">When</span>
                  <span className="text-[14px] font-semibold text-[#1a1a1c] truncate">Any date</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch my-2.5 bg-[#E7ECF3]" />

              {/* Category Field */}
              <div 
                ref={categoryRef}
                className={`flex-1 flex items-center gap-3 px-5 py-4 cursor-pointer rounded-xl transition-colors duration-200 relative ${activeField === "category" ? "bg-[#F5F7FB]" : "hover:bg-[#F5F7FB]/60"}`}
                onClick={() => { 
                  setCategoryOpen(!categoryOpen); 
                  setGuestsOpen(false); 
                  setActiveField("category");
                }}
              >
                <Home className={`w-4 h-4 flex-shrink-0 ${activeField === "category" ? "text-[#1a1a1c]" : "text-[#6B7A90]"}`} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B7A90] leading-none mb-1">Venue</span>
                  <span className="text-[14px] font-semibold text-[#1a1a1c] truncate">
                    {selectedCategory === "all" ? "All types" : categories.find(c => c.value === selectedCategory)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryOpen ? "rotate-180 text-[#1a1a1c]" : "text-[#6B7A90]"}`} />

                {categoryOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-[220px] bg-white rounded-xl shadow-[0_12px_40px_rgba(107,122,144,0.14),0_4px_12px_rgba(107,122,144,0.06)] border border-[#E7ECF3] overflow-hidden z-[9999] py-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat.value); setCategoryOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors duration-150 ${selectedCategory === cat.value ? "bg-[#F5F7FB]" : "hover:bg-[#F5F7FB]/60"}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#F5F7FB] flex items-center justify-center flex-shrink-0 border border-[#E7ECF3]/60">
                          {(() => {
                            const Icon = { all: LayoutGrid, apartments: Building2, villas: TreePalm, rooftops: Sunset, studios: Clapperboard }[cat.value] || LayoutGrid;
                            return <Icon className="w-3.5 h-3.5 text-[#1a1a1c]" />;
                          })()}
                        </div>
                        <span className={`text-[13px] flex-1 ${selectedCategory === cat.value ? "text-[#1a1a1c] font-semibold" : "text-[#1a1a1c]/70 font-medium"}`}>
                          {cat.label}
                        </span>
                        {selectedCategory === cat.value && (
                          <Check className="w-3.5 h-3.5 text-[#1a1a1c]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px self-stretch my-2.5 bg-[#E7ECF3]" />

              {/* Guests Field */}
              <div 
                ref={guestsRef}
                className={`flex-1 flex items-center gap-3 px-5 py-4 cursor-pointer rounded-xl transition-colors duration-200 relative ${activeField === "guests" ? "bg-[#F5F7FB]" : "hover:bg-[#F5F7FB]/60"}`}
                onClick={() => { 
                  setGuestsOpen(!guestsOpen); 
                  setCategoryOpen(false); 
                  setActiveField("guests");
                }}
              >
                <Users className={`w-4 h-4 flex-shrink-0 ${activeField === "guests" ? "text-[#1a1a1c]" : "text-[#6B7A90]"}`} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B7A90] leading-none mb-1">Guests</span>
                  <span className="text-[14px] font-semibold text-[#1a1a1c] truncate">
                    {selectedGuests ? `${selectedGuests}` : "Any size"}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${guestsOpen ? "rotate-180 text-[#1a1a1c]" : "text-[#6B7A90]"}`} />

                {guestsOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-[200px] bg-white rounded-xl shadow-[0_12px_40px_rgba(107,122,144,0.14),0_4px_12px_rgba(107,122,144,0.06)] border border-[#E7ECF3] overflow-hidden z-[9999] py-1">
                    {guestOptions.map((g) => (
                      <button
                        key={g.value}
                        onClick={(e) => { e.stopPropagation(); setSelectedGuests(g.value); setGuestsOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors duration-150 ${selectedGuests === g.value ? "bg-[#F5F7FB]" : "hover:bg-[#F5F7FB]/60"}`}
                      >
                        <div className="flex flex-col flex-1">
                          <span className={`text-[13px] ${selectedGuests === g.value ? "text-[#1a1a1c] font-semibold" : "text-[#1a1a1c]/70 font-medium"}`}>
                            {g.label}
                          </span>
                          <span className="text-[10px] text-[#6B7A90] font-medium">{g.sub}</span>
                        </div>
                        {selectedGuests === g.value && (
                          <Check className="w-3.5 h-3.5 text-[#1a1a1c]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearch}
                className="bg-[#1a1a1c] hover:bg-black text-white rounded-xl px-6 py-4 font-semibold text-[14px] ml-1.5 flex items-center gap-2.5 cursor-pointer transition-colors duration-200 shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
              >
                <Search className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </motion.div>


      </div>
    </section>
  )
}
