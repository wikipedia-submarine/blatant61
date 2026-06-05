"use client"

import { useState, useEffect, useCallback } from "react"
import { Star, MessageSquare, Check, Loader2, AlertCircle, X, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { getBuyerBookings, type FirestoreBooking } from "@/lib/firestore-bookings"
import { submitReview, getVenueReviews, getVenueStats, type FirestoreReview } from "@/lib/firestore-reviews"
import { motion, AnimatePresence } from "framer-motion"

interface VenueReviewsProps {
  venueId: string
  venueName: string
  hostId: string
}

export function VenueReviews({ venueId, venueName, hostId }: VenueReviewsProps) {
  const { user, userProfile } = useAuth()
  const [reviews, setReviews] = useState<FirestoreReview[]>([])
  const [stats, setStats] = useState({ avgRating: 0, reviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [eligibleBooking, setEligibleBooking] = useState<FirestoreBooking | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(3)
  
  // Form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [fetchedReviews, fetchedStats] = await Promise.all([
        getVenueReviews(venueId).catch(err => {
          console.warn("Permission denied for reviews fetch:", err)
          return []
        }),
        getVenueStats(venueId).catch(err => {
          console.warn("Permission denied for stats fetch:", err)
          return { avgRating: 0, reviewCount: 0 }
        })
      ])
      setReviews(fetchedReviews)
      setStats(fetchedStats)
      
      // Check eligibility if user is logged in
      if (user) {
        try {
          const bookings = await getBuyerBookings(user.uid)
          const unreviewed = bookings.find(
            b => b.venueId === venueId && b.status === "accepted" && !b.reviewed
          )
          setEligibleBooking(unreviewed || null)
        } catch (bookingErr) {
          console.warn("Permission denied for user bookings fetch:", bookingErr)
          setEligibleBooking(null)
        }
      }
    } catch (err) {
      console.error("Error fetching reviews data:", err)
    } finally {
      setLoading(false)
    }
  }, [venueId, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !eligibleBooking) return

    if (!comment.trim()) {
      setError("Please write a short comment about your stay.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await submitReview({
        venueId,
        bookingId: eligibleBooking.id!,
        reviewerId: user.uid,
        reviewerName: userProfile?.displayName || user.displayName || "Guest",
        reviewerImage: userProfile?.photoURL || user.photoURL || undefined,
        hostId,
        rating,
        comment: comment.trim(),
        isVerified: !!eligibleBooking.paid,
      })
      
      setSuccess(true)
      setTimeout(() => {
        setShowForm(false)
        setSuccess(false)
        setEligibleBooking(null) // Only once
        fetchData() // Refresh list
      }, 2000)
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#111111] mb-2">Guest reviews</h2>
          <div className="flex items-center gap-1.5 text-[14px]">
            <Star className="w-4 h-4 text-[#111111] fill-current" />
            <span className="font-bold text-[#111111]">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "0.0"}
            </span>
            <span className="text-[#6B7A90] font-medium">
              ({stats.reviewCount > 0 ? stats.reviewCount : 0} reviews)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {eligibleBooking && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[13px] font-bold text-white bg-[#111111] hover:bg-black px-4 py-2 rounded-lg transition-colors"
            >
              Write Review
            </button>
          )}
          {reviews.length > 3 && (
             <button className="text-[13px] font-bold text-[#6B7A90] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer group">
               View all reviews <span className="group-hover:translate-x-0.5 transition-transform">→</span>
             </button>
          )}
        </div>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-[20px] bg-[#F8FAFC] border border-[#E7ECF3] relative mb-4">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111111]">Published!</h3>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-[#111111]">Your Experience</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-[#6B7A90]" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-[#6B7A90] uppercase tracking-wider">Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={`p-3 rounded-[12px] border transition-all ${
                            rating >= s 
                              ? "bg-[#111111] border-[#111111] text-white" 
                              : "bg-white border-[#E7ECF3] text-[#6B7A90] hover:border-[#111111]/30"
                          }`}
                        >
                          <Star className={`w-5 h-5 ${rating >= s ? "fill-white" : ""}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-[#6B7A90] uppercase tracking-wider">Comment</p>
                    <textarea
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you love about this space?"
                      className="w-full p-4 rounded-[16px] bg-white border border-[#E7ECF3] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-colors outline-none text-[14px] min-h-[120px] resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[12px] font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-[12px] bg-[#111111] text-white font-bold text-[14px] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Review"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List (Horizontal Grid) */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reviews.slice(0, visibleCount).map((rev) => (
            <div key={rev.id} className="p-6 rounded-[20px] bg-[#F8FAFC] border border-[#E7ECF3] flex flex-col justify-between min-h-[160px] h-full transition-shadow hover:shadow-[0_4px_12px_rgba(107,122,144,0.05)]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#E7ECF3] flex items-center justify-center text-[#111111] font-bold text-[14px] overflow-hidden shrink-0">
                    {rev.reviewerImage ? (
                      <img src={rev.reviewerImage} alt={rev.reviewerName} className="w-full h-full object-cover" />
                    ) : (
                      rev.reviewerName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111111] text-[14px] leading-none mb-1 line-clamp-1">{rev.reviewerName}</h4>
                    <p className="text-[12px] text-[#6B7A90]">
                      {rev.createdAt?.toDate 
                        ? format(rev.createdAt.toDate(), "MMMM yyyy") 
                        : "2 weeks ago"}
                    </p>
                  </div>
                </div>
                
                <p className="text-[#111111] text-[13px] leading-relaxed mb-4 line-clamp-4">
                  {rev.comment}
                </p>
              </div>

              <div className="flex items-center gap-1 mt-auto">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-3.5 h-3.5 ${s <= rev.rating ? "fill-[#111111] text-[#111111]" : "text-[#E7ECF3]"}`} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-[#6B7A90] font-medium">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  )
}
