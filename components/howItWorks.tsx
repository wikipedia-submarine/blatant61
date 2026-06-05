"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MessageSquare, PartyPopper } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { ScrollReveal } from "./scrollReveal"

export function HowItWorks() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [animatedIcons, setAnimatedIcons] = useState<boolean[]>([false, false, false])
  const sectionRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])

  const steps = [
    { icon: Search, titleKey: "step1Title" as const, descriptionKey: "step1Description" as const },
    { icon: MessageSquare, titleKey: "step2Title" as const, descriptionKey: "step2Description" as const },
    { icon: PartyPopper, titleKey: "step3Title" as const, descriptionKey: "step3Description" as const },
  ]

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, 500)
        } else {
          setIsVisible(false)
        }
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const observers: IntersectionObserver[] = []

    iconRefs.current.forEach((ref, index) => {
      if (!ref) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setAnimatedIcons((prev) => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }, 300)
          } else {
            setAnimatedIcons((prev) => {
              const newState = [...prev]
              newState[index] = false
              return newState
            })
          }
        },
        { threshold: 0.5 },
      )

      observer.observe(ref)
      observers.push(observer)
    })

    return () => observers.forEach((obs) => obs.disconnect())
  }, [isMobile])

  const shouldAnimateIcon = (index: number) => {
    if (isMobile) {
      return animatedIcons[index]
    }
    return isVisible
  }

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-36 px-6 lg:px-8 overflow-hidden"
      style={{ backgroundColor: "#0B0B0F" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M-100 400 Q 300 200, 600 400 T 1300 400"
            stroke="rgba(100, 120, 140, 0.04)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M-100 500 Q 400 300, 700 500 T 1400 450"
            stroke="rgba(80, 100, 120, 0.03)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M0 200 Q 500 100, 900 250 T 1200 150"
            stroke="rgba(60, 130, 180, 0.025)"
            strokeWidth="1"
            fill="none"
          />
          <line x1="200" y1="0" x2="180" y2="800" stroke="rgba(100, 120, 140, 0.025)" strokeWidth="1" />
          <line x1="1000" y1="0" x2="1020" y2="800" stroke="rgba(100, 120, 140, 0.02)" strokeWidth="1" />
        </svg>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          backgroundColor: "rgba(11, 11, 15, 0.4)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-28">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white text-balance">
            {t.howItWorks.title}
          </h2>
          <p className="mt-8 text-lg md:text-xl text-gray-400 max-w-xl mx-auto">
            <span className={`blue-underline ${isVisible ? "animate-underline" : ""}`}>{t.howItWorks.subtitle}</span>
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-12">
          {steps.map((step, index) => (
            <ScrollReveal key={index} animation="up" delay={isMobile ? 0 : (index + 1) * 100}>
              <div className="text-center">
                <div
                  ref={(el) => {
                    iconRefs.current[index] = el
                  }}
                  className={`relative inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-10 cursor-pointer transition-all duration-500 ${shouldAnimateIcon(index) ? "icon-glow-animate" : ""
                    }`}
                  style={{
                    animationDelay: isMobile ? "0ms" : `${index * 150}ms`,
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: shouldAnimateIcon(index)
                      ? "0 0 40px rgba(0, 122, 255, 0.15), 0 0 80px rgba(0, 122, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[28px] transition-opacity duration-500"
                    style={{
                      background: "radial-gradient(circle at center, rgba(0, 122, 255, 0.12) 0%, transparent 70%)",
                      opacity: shouldAnimateIcon(index) ? 1 : 0,
                    }}
                  />
                  <step.icon className="relative z-10 w-10 h-10 text-[#007AFF]" strokeWidth={1.5} />
                </div>


                <h3 className="text-2xl md:text-3xl font-bold text-white mb-5">{t.howItWorks[step.titleKey]}</h3>

                <p className="text-gray-400 text-lg leading-relaxed max-w-xs mx-auto">
                  {t.howItWorks[step.descriptionKey]}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
