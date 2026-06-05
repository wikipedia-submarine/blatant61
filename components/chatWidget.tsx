"use client"

import { useState } from "react"
import { HelpCircle, X, ChevronDown } from "lucide-react"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  const questions = [
    {
      question: "How do I book a venue?",
      answer: "Browse venues, select your date, add guest count, and proceed to checkout with your contact information.",
    },
    {
      question: "What payment methods accepted?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods securely.",
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, cancellations are allowed up to 7 days before the event date with minimal fees.",
    },
    {
      question: "How do I list my space?",
      answer: "Click 'List Your Space', fill in details, upload photos, and our team will verify your listing.",
    },
    {
      question: "Is support available?",
      answer: "Yes, our customer support team is available 24/7 to assist you.",
    },
  ]

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-accent text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center bubblegum-animate md:w-16 md:h-16 cursor-pointer hover:cursor-pointer hover:bg-accent/90"
        aria-label="Open help panel"
      >
        {isOpen ? <X className="w-6 h-6 md:w-7 md:h-7" /> : <HelpCircle className="w-6 h-6 md:w-7 md:h-7" />}
      </button>

      {/* Questions panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-card rounded-2xl shadow-2xl border border-border/30 max-h-96 md:max-h-[500px] overflow-y-auto custom-scrollbar animate-fade-up">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-accent to-blue-600 text-white p-4 md:p-5 rounded-t-2xl">
            <h3 className="font-bold text-lg">Common Questions</h3>
          </div>

          {/* Questions */}
          <div className="divide-y divide-border/30">
            {questions.map((item, index) => (
              <div key={index} className="border-b border-border/20 last:border-b-0">
                <button
                  onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                  className="w-full px-4 md:px-5 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors duration-200 text-left group"
                >
                  <span className="font-semibold text-foreground text-sm md:text-base pr-3 group-hover:text-accent transition-colors">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${
                      openQuestion === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openQuestion === index && (
                  <div className="px-4 md:px-5 pb-4 bg-secondary/30 border-t border-border/20 animate-fade-up">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
