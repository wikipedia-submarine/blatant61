"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "./languageSwitcher"
import { AuthUserMenu } from "./authUserMenu"
import { useLoadingContext } from "@/lib/loading-context"

type NavItem = {
  id: string
  targetId: string
  icon: React.ReactNode
  labelKey: "festivo" | "venues" | "reviews" | "listYourSpace" | "faq"
}

const navItems: NavItem[] = [
  {
    id: "festivo",
    targetId: "#top",
    labelKey: "festivo",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    id: "venues",
    targetId: "/browse",
    labelKey: "venues",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: "testimonials",
    targetId: "#testimonials",
    labelKey: "reviews",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    id: "faq",
    targetId: "/faq",
    labelKey: "faq",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "list-space",
    targetId: "/list-your-space",
    labelKey: "listYourSpace",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

const sectionIds = ["top", "venues", "testimonials", "faq"]

const SECTION_VISIBILITY_THRESHOLD = 200

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
  mass: 1.2,
}

const glassSpringConfig = {
  type: "spring" as const,
  stiffness: 120,
  damping: 25,
  mass: 1.5,
}

interface GlassDockProps {
  activeIndex: number | null
  isAnimating: boolean
  tappedIndex: number | null
  onNavClick: (e: React.MouseEvent<HTMLButtonElement>, targetId: string, index: number) => void
  user?: { uid: string; email: string | null; displayName: string | null } | null
  loading?: boolean
  isAdmin?: boolean
}

function MobileGlassDock({ activeIndex, isAnimating, tappedIndex, onNavClick }: Omit<GlassDockProps, "variant">) {
  const { t } = useLanguage()
  const itemWidth = 100 / navItems.length
  const [hasAppeared, setHasAppeared] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasAppeared(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const textColor = "rgba(0, 0, 0, 0.8)"
  const activeColor = "#000000"
  const borderColor = "rgba(0, 0, 0, 0.04)"
  const bgColor = "rgba(255, 255, 255, 0.85)"
  const pillBg = "rgba(0, 0, 0, 0.08)"
  const shadowColor =
    "0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.4)"

  const getLabel = (item: NavItem) => {
    if (item.labelKey === "festivo") return "FESTIVO"
    return (t.header as any)[item.labelKey]
  }

  return (
    <>
      <motion.div
        className="absolute inset-0 -z-10 rounded-[40px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasAppeared ? 1 : 0 }}
        transition={glassSpringConfig}
        style={{
          background: "rgba(0, 0, 0, 0.03)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transform: "scale(1.05)",
        }}
      />

      <motion.div
        className="relative flex items-center justify-around px-3 py-2.5"
        initial={{
          borderRadius: 24,
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          borderRadius: hasAppeared ? 40 : 24,
          opacity: hasAppeared ? 1 : 0,
          scale: hasAppeared ? 1 : 0.95,
        }}
        whileTap={{
          borderRadius: 44,
          scale: 0.98,
        }}
        transition={glassSpringConfig}
        style={{
          background: bgColor,
          backdropFilter: `blur(${Math.max(0, hasAppeared ? 34 : 20)}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${Math.max(0, hasAppeared ? 34 : 20)}px) saturate(180%)`,
          boxShadow: shadowColor,
          border: `1px solid rgba(255, 255, 255, 0.4)`,
          width: "min(340px, 92vw)",
        }}
      >
        {activeIndex !== null && (
          <>
            {/* Chromatic glow - ROUND bubble */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none"
              style={{
                width: `calc(${itemWidth}% - 6px)`,
                background: "linear-gradient(135deg, rgba(0, 122, 255, 0.2) 0%, rgba(0, 122, 255, 0.15) 50%, rgba(90, 200, 245, 0.18) 100%)",
              }}
              initial={{ opacity: 0, left: `calc(${activeIndex * itemWidth}% + 3px)` }}
              animate={{
                left: `calc(${activeIndex * itemWidth}% + 3px)`,
                scaleX: isAnimating ? 1.25 : 1,
                scaleY: isAnimating ? 0.85 : 1,
                filter: isAnimating ? "blur(6px)" : "blur(8px)",
                opacity: isAnimating ? 0.85 : 1,
              }}
              transition={{ ...springConfig, filter: { type: "tween", duration: 0.2 } }}
            />

            {/* Pill behind active item */}
            <motion.div
              className="absolute top-2 bottom-2 rounded-full"
              style={{
                width: `calc(${itemWidth}% - 10px)`,
                background: pillBg,
                boxShadow: "0 2px 10px rgba(0, 122, 255, 0.15), inset 0 0.5px 0 rgba(255, 255, 255, 0.5)",
              }}
              initial={{ opacity: 0, left: `calc(${activeIndex * itemWidth}% + 5px)` }}
              animate={{
                left: `calc(${activeIndex * itemWidth}% + 5px)`,
                scaleX: isAnimating ? 1.25 : 1,
                scaleY: isAnimating ? 0.85 : 1,
                filter: isAnimating ? "blur(6px)" : "blur(0.01px)",
                opacity: isAnimating ? 0.8 : 1,
              }}
              transition={{ ...springConfig, filter: { type: "tween", duration: 0.2 } }}
            />
          </>
        )}

        {navItems.map((item, index) => {
          const isActive = activeIndex === index
          const isTapped = tappedIndex === index
          const label = getLabel(item)

          return (
            <button
              key={item.id}
              onClick={(e) => onNavClick(e, item.targetId, index)}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1 cursor-pointer"
              aria-label={label}
            >
              <AnimatePresence>
                {isTapped && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(0, 122, 255, 0.25) 0%, transparent 70%)`,
                    }}
                    initial={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1.5, filter: "blur(0.01px)" }}
                    exit={{ opacity: 0, scale: 2, filter: "blur(3px)" }}
                    transition={{ duration: 0.3, ease: "easeOut", filter: { type: "tween", duration: 0.2 } }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
                transition={springConfig}
                style={{
                  color: isActive ? activeColor : textColor,
                }}
              >
                {item.icon}
              </motion.div>

              <motion.span
                className="text-[9px] font-semibold"
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={springConfig}
                style={{
                  color: isActive ? activeColor : textColor,
                }}
              >
                {label}
              </motion.span>
            </button>
          )
        })}
      </motion.div>
    </>
  )
}

const desktopNavItems: NavItem[] = [
  {
    id: "venues",
    targetId: "/browse",
    labelKey: "venues",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: "testimonials",
    targetId: "#testimonials",
    labelKey: "reviews",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    id: "list-space",
    targetId: "/list-your-space",
    labelKey: "listYourSpace",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

type NavbarState = "initial" | "scrolled" | "expanded" | "compact"

function DesktopGlassDock({ activeIndex, isAnimating, tappedIndex, onNavClick, user, loading, isAdmin }: Omit<GlassDockProps, "variant"> & { isAdmin?: boolean }) {
  const { t, language } = useLanguage()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const isGeorgian = language === "ka"
  const [isHoverAnimating, setIsHoverAnimating] = useState(false)
  const itemWidth = 100 / desktopNavItems.length
  const desktopActiveIndex = activeIndex !== null && activeIndex > 0 ? activeIndex - 1 : null
  
  const displayIndex = hoveredIndex !== null ? hoveredIndex : desktopActiveIndex

  // Trigger jelly/stretch effect when highlighted index changes
  useEffect(() => {
    if (displayIndex !== null) {
      setIsHoverAnimating(true)
      const timer = setTimeout(() => setIsHoverAnimating(false), 400)
      return () => clearTimeout(timer)
    }
  }, [displayIndex])

  const displayAnimating = isAnimating || isHoverAnimating

  const textColor = "#1B1B1B"
  const activeColor = "#7889A8"

  const [navbarState, setNavbarState] = useState<NavbarState>("initial")
  const { isInitialLoading: globalInitialLoading } = useLoadingContext()
  const [hasLoaded, setHasLoaded] = useState(false)
  const lastScrollY = useRef(0)
  const accumulatedScrollUp = useRef(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isOverTestimonials, setIsOverTestimonials] = useState(false)

  // Use IntersectionObserver to avoid getBoundingClientRect layout thrashing
  useEffect(() => {
    const section = document.getElementById("testimonials")
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOverTestimonials(entry.isIntersecting)
      },
      {
        rootMargin: "-150px 0px -100px 0px", // Trigger slightly before it hits the threshold
        threshold: 0,
      }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Initial load animation
  useEffect(() => {
    if (!globalInitialLoading) {
      const timer = setTimeout(() => setHasLoaded(true), 400)
      return () => clearTimeout(timer)
    } else {
      setHasLoaded(false)
    }
  }, [globalInitialLoading])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      
      ticking = true
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const delta = scrollY - lastScrollY.current
        
        // Check testimonials section
        if (isOverTestimonials && activeIndex === 2) {
          if (navbarState !== "expanded") setNavbarState("expanded")
          lastScrollY.current = scrollY
          ticking = false
          return
        }

        // Threshold-based state triggers
        if (scrollY > 120) {
          if (delta > 0) {
            // Scrolling down
            accumulatedScrollUp.current = 0
            if (navbarState !== "compact") {
              setNavbarState("compact")
            }
          } else {
            // Scrolling up
            accumulatedScrollUp.current += Math.abs(delta)
            if (accumulatedScrollUp.current > 80) {
              if (navbarState !== "initial") {
                setNavbarState("initial")
              }
            }
          }
        } else {
          // Near top of page
          if (navbarState !== "initial") {
            setNavbarState("initial")
          }
          accumulatedScrollUp.current = 0
        }

        lastScrollY.current = scrollY
        ticking = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [navbarState, isOverTestimonials, activeIndex])

  const isExpanded = navbarState === "expanded"
  const isInitial  = navbarState === "initial" && hasLoaded
  const isCompact  = navbarState === "compact"
  const isOverReviews = activeIndex === 2

  const isLoggedOut = !loading && !user
  const currentGap = isExpanded ? 12 : isInitial ? 10 : 8
  const currentPaddingX = isExpanded ? 20 : isInitial ? (isLoggedOut ? 32 : 28) : 12
  const paddingTop = isCompact ? 48 : 10
  const paddingBottom = isCompact ? 10 : 10
  const currentRadius = isExpanded ? 18 : isInitial ? 22 : 24

  const navListVariants = {
    hidden: { 
      opacity: 0,
      paddingLeft: 0,
      paddingRight: 0,
      gap: 0,
    },
    visible: {
      opacity: 1,
      paddingLeft: currentPaddingX,
      paddingRight: currentPaddingX,
      gap: currentGap,
      y: 0,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
        paddingLeft: { type: "spring", stiffness: 300, damping: 30 },
        paddingRight: { type: "spring", stiffness: 300, damping: 30 },
        gap: { type: "spring", stiffness: 300, damping: 30 },
      },
    },
    compact: {
      opacity: 1,
      y: 0, // Children should NOT move relative to parent
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    }
  }

  // Million-dollar spring physics
  const luxurySpring = {
    type: "spring" as const,
    stiffness: 110,
    damping: 22,
    mass: 1.2
  }

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 0,
      paddingRight: 0,
      gap: 0,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: currentPaddingX,
      paddingRight: currentPaddingX,
      gap: currentGap,
      transition: {
        ...luxurySpring,
        staggerChildren: 0.1,
        delayChildren: 0.4,
      }
    },
    compact: {
      opacity: 1,
      y: "-64%",
      paddingTop: 62,
      paddingBottom: 10,
      paddingLeft: currentPaddingX,
      paddingRight: currentPaddingX,
      gap: currentGap,
      transition: luxurySpring
    }
  }

  const navItemVariants = {
    hidden: { scale: 0, opacity: 0, y: 10 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    compact: {
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
  }

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible Hover Zone for easier trigger when compact */}
      {isCompact && (
        <div className="absolute top-0 left-[-50vw] right-[-50vw] h-20 -z-20" />
      )}
      
      <motion.div
        className="relative flex items-center"
        initial="hidden"
        animate={hasLoaded ? (isCompact && !isHovered ? "compact" : "visible") : "hidden"}
        variants={containerVariants}
      >
      {/* Restore Control (Arrow Button) */}
      <AnimatePresence>
        {(isCompact && !isHovered) && (
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ ...luxurySpring, damping: 18 }}
            onClick={() => setNavbarState("initial")}
            className="absolute top-full left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-5 rounded-b-[18px] z-20 cursor-pointer border-l border-r border-b border-white/40"
            style={{
              background: "rgba(247, 246, 243, 0.78)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
            }}
          >
            <svg className="w-3 h-3 text-[#1E1E1E] mb-[1px] opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
      {/* Background Pill */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: hasLoaded ? 1 : 0, 
          opacity: hasLoaded ? 1 : 0,
          borderRadius: hasLoaded ? currentRadius : 50,
        }}
        transition={luxurySpring}
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          boxShadow: isCompact 
            ? "0 10px 30px -10px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4)"
            : "0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          willChange: "background-color"
        }}
      />

      {/* 1. FESTIVO Logo (0.4s) */}
      <motion.button
        variants={navItemVariants}
        transition={{ ...navItemVariants.visible.transition, delay: 0.4 }}
        onClick={(e) => onNavClick(e, "#top", 0)}
        className="relative font-black tracking-tight px-2 py-1 flex-shrink-0 cursor-pointer"
        style={{ color: "#1E1E1E", fontSize: "1.25rem" }}
        animate={{
          letterSpacing: isExpanded ? "-0.02em" : "-0.01em",
        }}
      >
        <span>FESTIVO</span>
      </motion.button>

      {/* 2. Divider (0.5s) */}
      <motion.div
        variants={navItemVariants}
        transition={{ ...navItemVariants.visible.transition, delay: 0.5 }}
        className="mx-0.5 h-5"
        animate={{
          opacity: isExpanded ? 0.2 : 0.15,
        }}
        style={{ width: 1, background: "rgba(30, 30, 30, 0.15)" }}
      />

      {/* 3. Main Nav Wrapper (Starts 0.6s) */}
      <motion.div
        variants={navItemVariants}
        transition={{ ...navItemVariants.visible.transition, delay: 0.6 }}
        className="flex items-center justify-around relative"
        animate={{
          width: isExpanded 
            ? (isGeorgian ? 330 : 270) 
            : isInitial 
              ? (isGeorgian ? 310 : 250) 
              : (isGeorgian ? 270 : 230),
        }}
      >
        {displayIndex !== null && (
          <>
            <motion.div
              className="absolute top-0 bottom-0 rounded-full pointer-events-none"
              style={{
                width: `calc(${itemWidth}% + 8px)`,
                background: isOverReviews
                  ? "linear-gradient(135deg, rgba(255, 200, 50, 0.2) 0%, rgba(255, 180, 50, 0.15) 50%, rgba(255, 220, 100, 0.18) 100%)"
                  : "linear-gradient(135deg, rgba(120, 137, 168, 0.15) 0%, rgba(120, 137, 168, 0.1) 50%, rgba(120, 137, 168, 0.12) 100%)",
                filter: "blur(12px)",
              }}
              initial={{ opacity: 0, left: `calc(${displayIndex * itemWidth}% - 4px)` }}
              animate={{
                left: `calc(${displayIndex * itemWidth}% - 4px)`,
                scaleX: displayAnimating ? 1.3 : 1,
                scaleY: displayAnimating ? 0.8 : 1,
                opacity: displayAnimating ? 0.9 : 1,
              }}
              transition={springConfig}
            />

            <motion.div
              className="absolute top-1 bottom-1 rounded-full"
              style={{
                width: `calc(${itemWidth}% - 4px)`,
                background: isOverReviews ? "rgba(255, 200, 50, 0.12)" : "rgba(120, 137, 168, 0.08)",
                boxShadow: "0 2px 12px rgba(120, 137, 168, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                border: "1px solid rgba(120, 137, 168, 0.15)",
              }}
              initial={{ opacity: 0, left: `calc(${displayIndex * itemWidth}% + 2px)` }}
              animate={{
                left: `calc(${displayIndex * itemWidth}% + 2px)`,
                scaleX: displayAnimating ? 1.3 : 1,
                scaleY: displayAnimating ? 0.8 : 1,
                opacity: displayAnimating ? 0.85 : 1,
              }}
              transition={springConfig}
            />
          </>
        )}

        {desktopNavItems.map((item, index) => {
          const isActive = desktopActiveIndex === index
          const isTapped = tappedIndex === index + 1
          const label = (t.header as any)[item.labelKey]

          return (
            <motion.button
              key={item.id}
              variants={navItemVariants}
              transition={{ ...navItemVariants.visible.transition, delay: 0.7 + index * 0.1 }}
              onClick={(e) => onNavClick(e, item.targetId, index + 1)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1 cursor-pointer"
              aria-label={label}
            >
              <AnimatePresence>
                {isTapped && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(0, 122, 255, 0.25) 0%, transparent 70%)`,
                    }}
                    initial={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1.5, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 2, filter: "blur(3px)" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={{
                  scale: isActive ? (isExpanded ? 1.2 : isInitial ? 1.1 : 1.05) : isExpanded ? 1 : isInitial ? 0.95 : 0.85,
                }}
                transition={springConfig}
                style={{
                  color: isActive ? activeColor : textColor,
                }}
              >
                {item.icon}
              </motion.div>

              <motion.span
                className="font-bold whitespace-nowrap text-xs"
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={springConfig}
                style={{
                  color: isActive ? activeColor : "#1E1E1E",
                  fontSize: "10px",
                }}
              >
                {label}
              </motion.span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* 4. Second Divider (Sequential after buttons) */}
      <motion.div
        variants={navItemVariants}
        transition={{ ...navItemVariants.visible.transition, delay: 1.1 }}
        className="ml-3 mr-2.5 h-5"
        animate={{
          opacity: isExpanded ? 0.2 : 0.15,
        }}
        style={{ width: 1, background: "rgba(30, 30, 30, 0.15)" }}
      />

      {/* 5. Last Wrapper (Sequential final) */}
      <motion.div
        variants={navItemVariants}
        transition={{ ...navItemVariants.visible.transition, delay: 1.2 }}
        className={`flex items-center pl-0 flex-shrink-0`} 
        style={{ width: "auto", justifyContent: "flex-start", gap: "8px" }}>
        <div style={{ color: "#1E1E1E" }}>
          <LanguageSwitcher variant="navbar" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", width: "auto", height: "48px" }}>
          {!loading ? (
            user ? (
              <AuthUserMenu variant="desktop" />
            ) : (
              <Link
                href="/sign-in"
                className="font-bold rounded-full hover:opacity-90 whitespace-nowrap transition-opacity duration-300 cursor-pointer inline-flex items-center justify-center"
                style={{
                  backgroundColor: "#111111",
                  color: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)",
                  transition: "background-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease, opacity 0.3s ease",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  fontSize: "1rem",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {t.header.signIn}
              </Link>
            )
          ) : (
            <div style={{ width: "120px", height: "48px" }} />
          )}
        </div>
      </motion.div>
      </motion.div>
    </div>
  )
}

function useDockState() {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [tappedIndex, setTappedIndex] = useState<number | null>(null)
  const [isManualScroll, setIsManualScroll] = useState(false)

  useEffect(() => {
    let ticking = false
    
    const handleScrollSpy = () => {
      if (isManualScroll || ticking) return
      
      ticking = true
      window.requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + window.innerHeight / 3

        if (scrollPosition < 300) {
          if (activeIndex !== 0) {
            setActiveIndex(0)
            setIsAnimating(true)
            setTimeout(() => setIsAnimating(false), 400)
          }
          ticking = false
          return
        }

        for (let i = sectionIds.length - 1; i >= 1; i--) {
          const section = document.getElementById(sectionIds[i])
          if (section) {
            const sectionTop = section.offsetTop
            if (scrollPosition >= sectionTop + SECTION_VISIBILITY_THRESHOLD) {
              if (activeIndex !== i) {
                setActiveIndex(i)
                setIsAnimating(true)
                setTimeout(() => setIsAnimating(false), 400)
              }
              ticking = false
              return
            }
          }
        }

        if (activeIndex !== 0) {
          setActiveIndex(0)
          setIsAnimating(true)
          setTimeout(() => setIsAnimating(false), 400)
        }
        ticking = false
      })
    }

    window.addEventListener("scroll", handleScrollSpy, { passive: true })
    handleScrollSpy()

    return () => window.removeEventListener("scroll", handleScrollSpy)
  }, [activeIndex, isManualScroll])

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, targetId: string, index: number) => {
    e.preventDefault()

    setTappedIndex(index)
    setTimeout(() => setTappedIndex(null), 250)

    // Handle page navigation
    if (targetId.startsWith("/")) {
      router.push(targetId)
      return
    }

    setIsManualScroll(true)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 400)
    setActiveIndex(index)

    setTimeout(() => setIsManualScroll(false), 1000)

    if (targetId === "#top") {
      if (window.location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        router.push("/")
      }
    } else if (targetId !== "#") {
      const element = document.querySelector(targetId)
      if (element) {
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        const offset = 100
        window.scrollTo({ top: elementTop - offset, behavior: "smooth" })
      }
    }
  }, [router])

  return { activeIndex, isAnimating, tappedIndex, handleNavClick }
}

export function MobileBottomNav() {
  const { activeIndex, isAnimating, tappedIndex, handleNavClick } = useDockState()

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-2">
      <MobileGlassDock
        activeIndex={activeIndex}
        isAnimating={isAnimating}
        tappedIndex={tappedIndex}
        onNavClick={handleNavClick}
      />
    </nav>
  )
}

interface DesktopNavbarProps {
  user?: { uid: string; email: string | null; displayName: string | null } | null
  loading?: boolean
  logout?: () => Promise<void>
  isAdmin?: boolean
}

export function DesktopNavbar({ user, loading, logout, isAdmin }: DesktopNavbarProps = {}) {
  const { activeIndex, isAnimating, tappedIndex, handleNavClick } = useDockState()

  return (
    <nav className="hidden md:flex fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <DesktopGlassDock
        activeIndex={activeIndex}
        isAnimating={isAnimating}
        tappedIndex={tappedIndex}
        onNavClick={handleNavClick}
        user={user}
        loading={loading}
        isAdmin={isAdmin}
      />
    </nav>
  )
}
