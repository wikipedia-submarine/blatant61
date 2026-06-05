"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Star, Quote, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { ScrollReveal } from "./scrollReveal"
import { Counter } from "./counter"
import { SectionDivider } from "./SectionDivider"

const testimonials = [
  { id: 1, name: "Mariam K.", location: "Tbilisi", reviewKey: "review1" as const, rating: 5, date: "2 months ago" },
  { id: 2, name: "Giorgi T.", location: "Batumi", reviewKey: "review2" as const, rating: 5, date: "3 weeks ago" },
  { id: 3, name: "Ana B.", location: "Kutaisi", reviewKey: "review3" as const, rating: 5, date: "1 month ago" },
  { id: 4, name: "David L.", location: "Tbilisi", reviewKey: "review1" as const, rating: 5, date: "5 days ago" },
  { id: 5, name: "Nino S.", location: "Borjomi", reviewKey: "review2" as const, rating: 5, date: "2 months ago" },
  { id: 6, name: "Luka M.", location: "Tbilisi", reviewKey: "review3" as const, rating: 4, date: "1 week ago" },
]

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0)
  return (
    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1c]/[0.04] flex-shrink-0">
      <span className="font-bold text-xs text-[#1a1a1c]/80">{initial}</span>
    </div>
  )
}

export function Testimonials() {
  const { t } = useLanguage()

  // Triple the items for seamless looping with wider viewports
  const row1Items = useMemo(() => [...testimonials.slice(0, 3), ...testimonials.slice(0, 3), ...testimonials.slice(0, 3)], [])
  const row2Items = useMemo(() => [...testimonials.slice(3, 6), ...testimonials.slice(3, 6), ...testimonials.slice(3, 6)], [])

  const TestimonialCard = ({ testimonial, index }: { testimonial: (typeof testimonials)[0], index: number }) => (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{
        duration: 9 + (index % 3),
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5
      }}
      className="flex-shrink-0"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        whileHover={{
          y: -6,
          scale: 1.015,
          boxShadow: "0 12px 32px -8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.03)",
        }}
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="relative flex flex-col w-[280px] md:w-[300px] lg:w-[320px] h-[180px] md:h-[195px] rounded-[20px] p-5 md:p-5 select-none cursor-pointer"
        style={{
          background: "linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        }}
      >

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={testimonial.name} />
            <div>
              <h4 className="font-semibold text-[#1a1a1c] leading-none text-[13px] tracking-tight">{testimonial.name}</h4>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-[#1a1a1c]/10"}`} />
                ))}
              </div>
            </div>
          </div>
          <Quote className="w-4 h-4 text-[#1a1a1c]/[0.05]" />
        </div>

        <p className="text-[#1a1a1c]/60 font-medium text-[13px] md:text-sm leading-[1.55] flex-1 tracking-tight line-clamp-3">
          &ldquo;{t.testimonials[testimonial.reviewKey]}&rdquo;
        </p>

        <div className="flex items-center justify-between mt-auto pt-2.5">
          <div className="flex items-center gap-1.5 text-[#1a1a1c]/40 text-[9px] font-bold uppercase tracking-wider">
            <MapPin className="w-2.5 h-2.5 text-[#1a1a1c]/30" />
            <span>{testimonial.location}</span>
          </div>
          <span className="text-[#1a1a1c]/30 text-[9px] font-semibold tracking-wider">{testimonial.date}</span>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-24 [@media(min-width:1600px)]:py-28 bg-[#F7F7F4] overflow-hidden relative z-[1]">

      {/* Mobile & Tablet: Stacked layout */}
      <div className="lg:hidden px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <ScrollReveal animation="up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-black/5 text-black/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              Guest feedback
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[#1a1a1c] leading-[0.95] mb-8">
              {t.testimonials.title.split(" ").map((word: string, i: number) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h2>
          </ScrollReveal>

          <ScrollReveal animation="up" delay={0.1}>
            <div className="flex items-center gap-10 justify-center">
              <div className="flex flex-col items-center">
                <p className="text-3xl md:text-4xl font-bold text-[#1a1a1c] tracking-tighter leading-none">
                  <Counter value={4.9} decimals={1} delay={0.3} />
                </p>
                <p className="text-[9px] font-bold text-[#1a1a1c]/30 uppercase tracking-[0.15em] mt-2">Avg Rating</p>
              </div>
              <div className="w-px h-10 bg-black/[0.06]" />
              <div className="flex flex-col items-center">
                <p className="text-3xl md:text-4xl font-bold text-[#1a1a1c] tracking-tighter leading-none">
                  <Counter value={1000} suffix="+" delay={0.5} />
                </p>
                <p className="text-[9px] font-bold text-[#1a1a1c]/30 uppercase tracking-[0.15em] mt-2">Bookings</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="mb-12">
          <SectionDivider />
        </div>

        {/* Mobile marquee — full width */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#F7F7F4] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#F7F7F4] to-transparent pointer-events-none" />

          <div className="flex flex-col gap-5 overflow-hidden py-4">
            <div className="flex overflow-hidden select-none">
              <motion.div
                animate={{ x: ["0%", "-33.33%"] }}
                transition={{ ease: "linear", duration: 28, repeat: Infinity }}
                className="flex gap-5 w-max pr-5"
              >
                {row1Items.map((testimonial, index) => (
                  <TestimonialCard testimonial={testimonial} index={index} key={`m-row1-${testimonial.id}-${index}`} />
                ))}
              </motion.div>
            </div>
            <div className="flex overflow-hidden select-none">
              <motion.div
                animate={{ x: ["-33.33%", "0%"] }}
                transition={{ ease: "linear", duration: 28, repeat: Infinity }}
                className="flex gap-5 w-max pr-5"
              >
                {row2Items.map((testimonial, index) => (
                  <TestimonialCard testimonial={testimonial} index={index} key={`m-row2-${testimonial.id}-${index}`} />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Integrated editorial layout */}
      <div className="hidden lg:block">
        <div className="max-w-[1400px] [@media(min-width:1600px)]:max-w-[1600px] mx-auto px-8 relative">

          {/* Text panel — overlaps the cards area with higher z-index */}
          <div className="relative z-20 flex items-start">
            <div className="w-[38%] xl:w-[34%] [@media(min-width:1600px)]:w-[30%] flex-shrink-0 py-8">
              <ScrollReveal animation="up">
                <span className="inline-block px-4 py-1.5 rounded-full bg-black/5 text-black/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  Guest feedback
                </span>
                <h2 className="text-5xl xl:text-6xl [@media(min-width:1600px)]:text-7xl font-bold tracking-tighter text-[#1a1a1c] leading-[0.95] mb-8 xl:mb-10">
                  {t.testimonials.title.split(" ").map((word: string, i: number) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h2>
              </ScrollReveal>

              <ScrollReveal animation="up" delay={0.1}>
                <div className="flex items-center gap-12 xl:gap-14">
                  <div className="flex flex-col">
                    <p className="text-4xl xl:text-5xl font-bold text-[#1a1a1c] tracking-tighter leading-none">
                      <Counter value={4.9} decimals={1} delay={0.3} />
                    </p>
                    <p className="text-[10px] font-bold text-[#1a1a1c]/25 uppercase tracking-[0.15em] mt-3">Avg Rating</p>
                  </div>
                  <div className="w-px h-12 bg-black/[0.06]" />
                  <div className="flex flex-col">
                    <p className="text-4xl xl:text-5xl font-bold text-[#1a1a1c] tracking-tighter leading-none">
                      <Counter value={1000} suffix="+" delay={0.5} />
                    </p>
                    <p className="text-[10px] font-bold text-[#1a1a1c]/25 uppercase tracking-[0.15em] mt-3">Bookings</p>
                  </div>
                </div>
              </ScrollReveal>

              <div className="mt-8 opacity-60">
                <SectionDivider />
              </div>
            </div>
          </div>

          {/* Cards area — positioned to overlap with text panel, extends to the right edge */}
          <div
            className="absolute top-0 bottom-0 right-0 flex flex-col justify-center gap-5"
            style={{ left: "28%", width: "auto" }}
          >
            {/* Fade mask — left edge blends into the text panel background */}
            <div
              className="absolute inset-y-0 left-0 z-30 pointer-events-none"
              style={{
                width: "220px",
                background: "linear-gradient(to right, #F7F7F4 0%, #F7F7F4 20%, rgba(247,247,244,0.85) 45%, rgba(247,247,244,0) 100%)",
              }}
            />
            {/* Fade mask — right edge */}
            <div
              className="absolute inset-y-0 right-0 z-30 pointer-events-none"
              style={{
                width: "120px",
                background: "linear-gradient(to left, #F7F7F4 0%, rgba(247,247,244,0) 100%)",
              }}
            />

            {/* Row 1 — sliding left */}
            <div className="flex overflow-hidden select-none py-4 -my-4">
              <motion.div
                animate={{ x: ["0%", "-33.33%"] }}
                transition={{ ease: "linear", duration: 35, repeat: Infinity }}
                className="flex gap-5 w-max pr-5 py-2"
              >
                {row1Items.map((testimonial, index) => (
                  <TestimonialCard testimonial={testimonial} index={index} key={`row1-${testimonial.id}-${index}`} />
                ))}
              </motion.div>
            </div>

            {/* Row 2 — sliding right */}
            <div className="flex overflow-hidden select-none py-4 -my-4">
              <motion.div
                animate={{ x: ["-33.33%", "0%"] }}
                transition={{ ease: "linear", duration: 35, repeat: Infinity }}
                className="flex gap-5 w-max pr-5 py-2"
              >
                {row2Items.map((testimonial, index) => (
                  <TestimonialCard testimonial={testimonial} index={index} key={`row2-${testimonial.id}-${index}`} />
                ))}
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
