"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, X, Loader2, Send } from "lucide-react"
import { submitReview } from "@/lib/firestore-reviews"
import { toast } from "sonner"

interface Props {
  booking: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ booking, isOpen, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating")
      return
    }

    setIsSubmitting(true)
    try {
      await submitReview({
        venueId: booking.venueId,
        bookingId: booking.id,
        reviewerId: booking.buyerId,
        reviewerName: booking.buyerName,
        hostId: booking.posterId,
        rating,
        comment,
      })
      toast.success("Thank you for your review!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-border/50"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Rate your stay</h2>
                  <p className="text-muted-foreground text-sm mt-1">{booking.venueName}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-4">
                  <p className="font-semibold text-foreground">How was your experience?</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform active:scale-90"
                      >
                        <Star 
                          className={`w-10 h-10 transition-colors ${
                            (hoveredRating || rating) >= star 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-amber-500 uppercase tracking-widest h-5">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Amazing!"}
                  </p>
                </div>

                {/* Comment Area */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground/60 uppercase tracking-widest ml-1">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell others what you loved about this place..."
                    className="w-full h-32 p-4 rounded-2xl bg-secondary/50 border border-border/40 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none resize-none text-foreground"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
