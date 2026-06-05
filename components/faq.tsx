"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { ScrollReveal } from "./scrollReveal"

export function FAQ() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How do I book a venue on FESTIVO?",
      answer: "Booking is easy! Browse our available venues, select your preferred date and guest count, and click 'View Details'. You can then proceed with the booking by providing your contact information.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods. All payments are processed securely through our encrypted payment gateway.",
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes, you can cancel or modify your booking up to 7 days before the event date. A small cancellation fee may apply depending on your booking terms.",
    },
    {
      question: "What's included in the venue price?",
      answer: "The venue price typically includes the space rental and basic amenities listed. Additional services like catering, decoration, or equipment rental may have separate costs.",
    },
    {
      question: "How do I list my space on FESTIVO?",
      answer: "Click on 'List Your Space' in the navigation menu and fill out the form with your venue details, photos, pricing, and amenities. Our team will verify your listing before it goes live.",
    },
    {
      question: "Is there customer support available?",
      answer: "Yes! Our customer support team is available 24/7 to help with any questions or concerns. Contact us through the website or email support.",
    },
  ]

  return (
    <section className="py-36 px-6 lg:px-8 pt-28 md:pt-48 pb-24 md:pb-36 relative z-[1] section-soft-cream overflow-visible">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-24 md:top-32 left-1/4 w-28 md:w-72 h-28 md:h-72 bg-gradient-to-br from-apple-yellow/20 md:from-apple-yellow/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-36 md:top-40 right-1/4 w-24 md:w-64 h-24 md:h-64 bg-gradient-to-br from-accent/20 md:from-accent/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative overflow-visible">
        <ScrollReveal className="text-center mb-16 md:mb-24 relative z-30">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground text-balance relative z-30">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about booking and listing venues
          </p>
        </ScrollReveal>

        <ScrollReveal animation="up" className="relative z-20 space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors duration-300 cursor-pointer"
              >
                <h3 className="text-lg md:text-xl font-semibold text-foreground pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 md:w-6 md:h-6 text-accent flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 md:px-8 pb-5 md:pb-6 border-t border-border/30 animate-fade-up">
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  )
}
