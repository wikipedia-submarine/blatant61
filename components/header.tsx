"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { LanguageSwitcher } from "./languageSwitcher"
import { MobileBottomNav, DesktopNavbar } from "./mobileBottomNav"
import { AuthUserMenu } from "./authUserMenu"
import { Heart } from "lucide-react"

function OldHeader() {
  const [isMobile, setIsMobile] = useState(false)
  const [isOverDarkSection, setIsOverDarkSection] = useState(false)
  const { t } = useLanguage()
  const { user, loading, logout, isAdmin } = useAuth()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const howItWorksSection = document.getElementById("how-it-works")
    if (!howItWorksSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOverDarkSection(entry.isIntersecting)
      },
      {
        rootMargin: "-64px 0px -100% 0px",
        threshold: 0
      }
    )

    observer.observe(howItWorksSection)
    return () => observer.disconnect()
  }, [isMobile])

  const textColor = isOverDarkSection ? "#ffffff" : undefined
  const bgStyle = isOverDarkSection
    ? {
        background: "rgba(30, 30, 35, 0.85)",
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
        boxShadow: "0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0.5px 0 rgba(255, 255, 255, 0.15)",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        transition: "background-color 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease",
      }
    : {
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
        boxShadow: "0 1px 0 rgba(0, 0, 0, 0.03), inset 0 0.5px 0 rgba(255, 255, 255, 0.4)",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        transition: "background-color 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease",
      }

  return (
    <>
      {isMobile && (
        <header className="fixed z-10 top-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full pointer-events-auto" style={bgStyle}>
            <div
              className="flex items-center justify-between px-4 h-16 gap-3"
              style={{ maxWidth: "80rem", marginLeft: "auto", marginRight: "auto", width: "100%" }}
            >
              <Link
                href="/"
                className="font-extrabold tracking-tight text-base sm:text-xl flex-shrink-0"
                style={{ color: textColor, transition: "color 0.4s ease" }}
              >
                FESTIVO
              </Link>

              <div className={`flex items-center flex-shrink-0`} style={{ gap: !loading && user ? "4px" : "8px", width: !loading && user ? "auto" : "auto" }}>
                <LanguageSwitcher variant="navbar" isOverDarkSection={isOverDarkSection} />
                <div style={{ width: "auto", display: "flex", alignItems: "center", justifyContent: "flex-end", height: "48px" }}>
                  {!loading ? (
                    user ? (
                      <>
                        <div className="hidden sm:flex flex-col items-end min-w-0 flex-1 pr-2">
                          <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: textColor }}>
                            {user.displayName || user.email?.split("@")[0]}
                          </p>
                          {isAdmin && (
                            <p className="text-xs text-accent font-medium">Admin</p>
                          )}
                        </div>
                        <AuthUserMenu variant="mobile" />
                      </>
                    ) : (
                      <Link
                        href="/sign-in"
                          className="font-bold rounded-full hover:opacity-90 whitespace-nowrap transition-opacity duration-300 cursor-pointer inline-flex items-center justify-center"
                        style={{
                          backgroundColor: isOverDarkSection ? "#ffffff" : "var(--foreground)",
                          color: isOverDarkSection ? "#111111" : "var(--background)",
                          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)",
                          transition: "background-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease, opacity 0.3s ease",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          paddingTop: "8px",
                          paddingBottom: "8px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "0.75rem",
                        }}
                      >
                        {t.header.signIn}
                      </Link>
                    )
                  ) : (
                    <div style={{ width: "40px", height: "40px" }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <MobileBottomNav />

      <DesktopNavbar user={user} loading={loading} logout={logout} isAdmin={isAdmin} />
    </>
  )
}

function NewHeader() {
  const [isMobile, setIsMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { t } = useLanguage()
  const { user, loading, logout, isAdmin } = useAuth()

  const pathname = usePathname()
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    checkMobile()
    handleScroll()
    
    window.addEventListener("resize", checkMobile)
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const isBrowse = pathname === '/browse'

  // Floating pill navbar for browse page
  if (isBrowse) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none py-4 md:py-5">
          <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 flex justify-center">
            <div className="pointer-events-auto bg-white rounded-full border border-[rgba(74,95,127,0.06)] px-6 py-3 flex items-center gap-8 transition-all duration-300">
              {/* Logo */}
              <Link href="/" className="font-extrabold tracking-tight text-lg text-[#111827]">
                Festivo
              </Link>

              {/* Center: Links (Desktop only) */}
              {!isMobile && (
                <nav className="hidden md:flex items-center gap-8 font-semibold text-[13px] text-[#111827]">
                  <Link href="/browse" className="hover:text-[#4A5F7F] transition-colors">Venues</Link>
                  <Link href="/browse" className="hover:text-[#4A5F7F] transition-colors">Categories</Link>
                  <Link href="/list-your-space" className="hover:text-[#4A5F7F] transition-colors">List Your Space</Link>
                  <Link href="/about" className="hover:text-[#4A5F7F] transition-colors">About</Link>
                </nav>
              )}

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {!isMobile && (
                  <Link href="/profile/saved" className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center hover:bg-[#F7F9FC] transition-colors cursor-pointer">
                    <Heart className="w-4 h-4 text-[#6B7280]" />
                  </Link>
                )}

                {!loading ? (
                  user ? (
                    <AuthUserMenu variant="desktop" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#3B4E69] flex items-center justify-center text-white text-[12px] font-bold">
                        SG
                      </div>
                    </div>
                  )
                ) : (
                  <div className="w-[100px] h-[36px]" />
                )}
              </div>
            </div>
          </div>
        </header>

        {isMobile && <MobileBottomNav />}
      </>
    )
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-auto ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(107,122,144,0.08)] py-3 md:py-4 border-b border-[#E7ECF3]" 
            : "bg-[#F5F7FB] backdrop-blur-md py-5 md:py-6"
        }`}
      >
        <div className="w-full max-w-[1600px] min-[1700px]:max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="font-extrabold tracking-tight text-xl md:text-[22px] text-[#1a1a1c] min-w-[150px]">
            FESTIVO
          </Link>

          {/* Center: Links (Desktop only) */}
          {!isMobile && (
            <nav className="hidden md:flex items-center gap-10 min-[1440px]:gap-12 font-semibold text-[13px] text-[#1a1a1c]">
              <Link href="/browse" className="hover:opacity-70 transition-opacity">Venues</Link>
              <Link href="/browse" className="hover:opacity-70 transition-opacity">Categories</Link>
              <Link href="/list-your-space" className="hover:opacity-70 transition-opacity">List Your Space</Link>
              <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
            </nav>
          )}

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-3 md:gap-4 min-w-[150px]">
            {!isMobile && (
              <button className="w-10 h-10 rounded-full bg-[#f8f9fa] border border-black/5 flex items-center justify-center hover:bg-[#f1f3f5] transition-colors cursor-pointer">
                <Heart className="w-[18px] h-[18px] text-[#1a1a1c]" />
              </button>
            )}

            {!loading ? (
              user ? (
                <div className="flex items-center">
                  <AuthUserMenu variant="desktop" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/sign-in"
                    className="hidden md:flex items-center justify-center font-bold bg-white text-[#1a1a1c] border border-black/10 rounded-full px-6 py-2.5 text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="flex items-center justify-center font-bold bg-[#1a1a1c] text-white rounded-full px-6 py-2.5 text-[13px] shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-black transition-all"
                  >
                    Sign up
                  </Link>
                </div>
              )
            ) : (
              <div className="w-[180px] h-[42px]" />
            )}
          </div>
        </div>
      </header>

      {isMobile && <MobileBottomNav />}
    </>
  )
}

export function Header() {
  const pathname = usePathname()
  
  if (pathname === "/") {
    return <OldHeader />
  }
  
  return <NewHeader />
}

