"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getPosterBookings, getBuyerBookings, updateBookingStatus, cancelBooking, markBookingAsPaid, checkBookingTimeout, FirestoreBooking } from "@/lib/firestore-bookings"
import { format } from "date-fns"
import { ReviewModal } from "@/components/reviewModal"
import { Inbox, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2, Send, CalendarDays, Ban, Phone, Mail, User, CreditCard, Info, Plus, Star } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

function CountdownTimer({ acceptedAt, onTimeout }: { acceptedAt: any, onTimeout: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const updateTimer = () => {
      if (!acceptedAt) {
        setTimeLeft("SYNCING")
        return
      }

      let start: Date | null = null
      
      if (acceptedAt instanceof Timestamp) {
        start = acceptedAt.toDate()
      } else if (acceptedAt instanceof Date) {
        start = acceptedAt
      } else if (typeof acceptedAt === 'object' && 'seconds' in acceptedAt) {
        start = new Date((acceptedAt as any).seconds * 1000)
      } else if (typeof acceptedAt === 'string' || typeof acceptedAt === 'number') {
        start = new Date(acceptedAt)
      }

      console.log("[DEBUG COUNTDOWN] start:", start, "Raw acceptedAt:", acceptedAt);

      if (!start || isNaN(start.getTime())) {
        console.log("[DEBUG COUNTDOWN] INVALID DATE. Showing SYNCING.");
        setTimeLeft("SYNCING")
        return
      }

      const end = start.getTime() + 3 * 60 * 60 * 1000
      const diff = end - Date.now()
      
      console.log(`[DEBUG COUNTDOWN] diff ms:`, diff);

      if (diff <= 0) {
        console.log("[DEBUG COUNTDOWN] DIFF <= 0! Calling onTimeout()!");
        setTimeLeft("EXPIRED")
        onTimeout()
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${hours > 0 ? `${hours}h ` : ""}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [acceptedAt, onTimeout])

  const isExpired = timeLeft === "EXPIRED"
  const isSyncing = timeLeft === "SYNCING"

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs xl:text-sm shadow-sm transition-colors duration-500 ${
      isExpired ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
      isSyncing ? "bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse" :
      "bg-amber-500/10 text-amber-600 border border-amber-500/20"
    }`}>
      <Clock className={`w-4 h-4 ${isSyncing ? "animate-spin-slow" : ""}`} />
      <span>{isSyncing ? "INITIALIZING..." : isExpired ? "TIMED OUT" : `EXPIRES IN ${timeLeft}`}</span>
    </div>
  )
}

type Tab = "incoming" | "sent"

function BookingCard({ booking, showActions, isSent, processingId, onAction, onCancel, onPay, onTimeout }: {
  booking: FirestoreBooking
  showActions: boolean
  isSent: boolean
  processingId: string | null
  onAction: (id: string, action: "accepted" | "denied") => void
  onCancel: (id: string) => void
  onPay: (id: string) => void
  onTimeout: (id: string) => void
}) {
  const sortedDates = [...booking.dates].sort()
  const [reviewingBooking, setReviewingBooking] = useState<any>(null)

  return (
    <div 
      className={`p-6 sm:p-8 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border ${
        booking.status === 'pending' ? 'border-accent/30 shadow-[0_8px_30px_rgba(74,95,127,0.12)]' :
        booking.status === 'cancelled' ? 'border-border/30 shadow-sm opacity-60' :
        'border-border/50 shadow-sm opacity-80'
      } transition-all duration-300`}
    >
      <ReviewModal 
        booking={reviewingBooking}
        isOpen={!!reviewingBooking}
        onClose={() => setReviewingBooking(null)}
        onSuccess={() => window.location.reload()}
      />
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Venue Image */}
        <div className="relative w-full sm:w-[240px] h-[180px] sm:h-[160px] rounded-2xl overflow-hidden flex-shrink-0 bg-secondary shadow-sm">
          <Image 
            src={booking.venueImage || "/images/venues/default.jpg"}
            alt={booking.venueName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-sm truncate">{booking.venueName}</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-bold text-accent uppercase tracking-wider mb-1">
                  {showActions ? "Requested By" : "Your Request"}
                </p>
                <p className="text-xl font-bold text-foreground truncate">
                  {showActions ? booking.buyerName : booking.venueName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {showActions ? booking.buyerEmail : `Sent as ${booking.buyerName}`}
                </p>
              </div>
              
              {/* Status Badge */}
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
                booking.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                booking.status === 'accepted' ? 'bg-green-500/10 text-green-600' :
                booking.status === 'cancelled' ? 'bg-gray-500/10 text-gray-500' :
                'bg-red-500/10 text-red-600'
              }`}>
                {booking.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                {booking.status === 'accepted' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {booking.status === 'denied' && <XCircle className="w-3.5 h-3.5" />}
                {booking.status === 'cancelled' && <Ban className="w-3.5 h-3.5" />}
                {booking.status === 'timeout' && <Clock className="w-3.5 h-3.5" />}
                {booking.status === 'accepted' && booking.paid ? "PAID & CONFIRMED" : booking.status.toUpperCase()}
              </div>
            </div>

            {/* Notification/Info Banners */}
            {isSent && booking.status === 'pending' && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-blue-700 dark:text-blue-400">Next Steps</p>
                  <p className="text-blue-600/80 dark:text-blue-400/80">Wait for the host to review your request. If accepted, you will have exactly 3 hours to complete the payment to secure your booking.</p>
                </div>
              </div>
            )}

            {isSent && booking.status === 'accepted' && !booking.paid && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm flex-1">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="font-bold text-amber-700 dark:text-amber-400">Payment Required</p>
                    <CountdownTimer acceptedAt={booking.acceptedAt} onTimeout={() => onTimeout(booking.id!)} />
                  </div>
                  <p className="text-amber-600/80 dark:text-amber-400/80">The host accepted your request! Complete payment within 3 hours or the request will time out and the dates will become available again.</p>
                </div>
              </div>
            )}

            {booking.status === 'timeout' && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-3">
                <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-red-700 dark:text-red-400">Request Timed Out</p>
                  <p className="text-red-600/80 dark:text-red-400/80">Payment was not completed within the required 3-hour window. These dates are now available for others to book.</p>
                </div>
              </div>
            )}

            {booking.paid && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/5 border border-green-500/20 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-green-700 dark:text-green-400">Payment Successful</p>
                  <p className="text-green-600/80 dark:text-green-400/80">Your booking is confirmed! The host has been notified of your payment.</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-secondary/30 mt-4">
              <div className="space-y-3">
                {/* Requester contact details for host view */}
                {showActions && (
                  <div className="pb-3 mb-3 border-b border-border/40 space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Contact Info</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="font-semibold text-foreground">{booking.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                        <a href={`mailto:${booking.buyerEmail}`} className="text-accent hover:underline truncate">{booking.buyerEmail}</a>
                      </div>
                      {booking.buyerPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                          <a href={`tel:${booking.buyerPhone}`} className="text-accent hover:underline font-semibold">{booking.buyerPhone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Selected Dates</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedDates.map(d => (
                      <span key={d} className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-bold">
                        {format(new Date(d + "T00:00:00"), "MMM d")}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-x-6 gap-y-2 pt-2 border-t border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Nights</p>
                    <p className="font-bold text-sm text-foreground">{booking.dates.length}</p>
                  </div>
                  <div className="w-px h-6 bg-border/60" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">
                      {showActions ? "Total Payout" : "Total Cost"}
                    </p>
                    <p className="font-extrabold text-lg text-accent">${booking.totalPrice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accept/Deny for incoming requests */}
          {showActions && booking.status === 'pending' && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/40">
              <button
                onClick={() => onAction(booking.id!, "accepted")}
                disabled={processingId === booking.id}
                className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {processingId === booking.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Booking"}
              </button>
              <button
                onClick={() => onAction(booking.id!, "denied")}
                disabled={processingId === booking.id}
                className="flex-1 py-3 px-4 rounded-xl bg-secondary hover:bg-red-500 hover:text-white text-foreground font-bold active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Deny
              </button>
            </div>
          )}

          {isSent && booking.status === 'accepted' && (
            <div className="mt-6 pt-6 border-t border-border/40">
              {booking.reviewed ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 text-green-600 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Review Submitted
                </div>
              ) : (
                <button
                  onClick={() => setReviewingBooking(booking)}
                  className="w-full py-4 px-6 rounded-xl bg-white dark:bg-[#1a1a1c] text-[#1a1a1c] dark:text-white border border-black/10 dark:border-white/10 font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  Rate Your Experience
                </button>
              )}
            </div>
          )}

          {/* Pay Button for accepted bookings */}
          {isSent && booking.status === 'accepted' && !booking.paid && (
            <div className="mt-6 pt-6 border-t border-border/40">
              <button
                onClick={() => onPay(booking.id!)}
                disabled={processingId === booking.id}
                className="w-full py-4 px-6 rounded-xl bg-[#1a1a1c] dark:bg-white text-white dark:text-[#1a1a1c] font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {processingId === booking.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Complete Payment"
                )}
              </button>
            </div>
          )}

          {/* Cancel for sent bookings that are still pending */}
          {isSent && (booking.status === 'pending' || (booking.status === 'accepted' && !booking.paid)) && (
            <div className="mt-4">
              <button
                onClick={() => onCancel(booking.id!)}
                disabled={processingId === booking.id}
                className="w-full py-3 px-4 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {processingId === booking.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RequestsDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [incomingBookings, setIncomingBookings] = useState<FirestoreBooking[]>([])
  const [sentBookings, setSentBookings] = useState<FirestoreBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("sent")
  const [reviewingBooking, setReviewingBooking] = useState<any>(null)

  useEffect(() => {
    async function loadRequests() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [incoming, sent] = await Promise.all([
          getPosterBookings(user.uid).catch(err => {
            console.warn("Failed to load incoming bookings:", err)
            return [] as FirestoreBooking[]
          }),
          getBuyerBookings(user.uid).catch(err => {
            console.warn("Failed to load sent bookings:", err)
            return [] as FirestoreBooking[]
          }),
        ])
        setIncomingBookings(incoming)
        setSentBookings(sent)
        
        if (incoming.length > 0 && sent.length === 0) {
          setActiveTab("incoming")
        }

        // Check for timeouts on accepted but unpaid bookings
        const checkTimeouts = async () => {
          const sentUpdates = await Promise.all(sent.map(async b => {
            const timedOut = await checkBookingTimeout(b)
            return timedOut ? { ...b, status: "timeout" as const } : b
          }))
          const incomingUpdates = await Promise.all(incoming.map(async b => {
            const timedOut = await checkBookingTimeout(b)
            return timedOut ? { ...b, status: "timeout" as const } : b
          }))
          setSentBookings(sentUpdates)
          setIncomingBookings(incomingUpdates)
        }
        checkTimeouts()
      } catch (err: any) {
        console.error("Failed to load bookings:", err)
        setError(err?.message || "Failed to load bookings")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadRequests()
    }
  }, [user, authLoading])

  const handleAction = async (bookingId: string, action: "accepted" | "denied") => {
    try {
      setProcessingId(bookingId)
      await updateBookingStatus(bookingId, action)
      setIncomingBookings(prev => prev.map(b => b.id === bookingId ? { 
        ...b, 
        status: action,
        ...(action === "accepted" ? { acceptedAt: new Date() } : {})
      } : b))
    } catch (err: any) {
      console.error(`Failed to ${action} booking:`, err)
      setError(err?.message || `Failed to ${action} booking`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleCancel = async (bookingId: string) => {
    try {
      setProcessingId(bookingId)
      await cancelBooking(bookingId)
      setSentBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b))
      setIncomingBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b))
      toast.success("Booking request cancelled")
    } catch (err: any) {
      console.error("Failed to cancel booking:", err)
      setError(err?.message || "Failed to cancel booking")
    } finally {
      setProcessingId(null)
    }
  }

  const handlePay = async (bookingId: string) => {
    try {
      setProcessingId(bookingId)
      await markBookingAsPaid(bookingId)
      setSentBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paid: true } : b))
      toast.success("Payment successful! Your booking is confirmed.")
    } catch (err: any) {
      console.error("Failed to process payment:", err)
      toast.error("Failed to process payment")
    } finally {
      setProcessingId(null)
    }
  }

  const handleTimeout = async (bookingId: string) => {
    // Timeout is handled during data load, but we update locally for immediate UI response
    setSentBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "timeout" } : b))
    setIncomingBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "timeout" } : b))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">You must be logged in</h1>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:opacity-90 transition-opacity">Sign In</Link>
          <Link href="/sign-up" className="px-6 py-3 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors">Sign Up</Link>
        </div>
      </div>
    )
  }

  const currentBookings = activeTab === "incoming" ? incomingBookings : sentBookings
  const pendingIncoming = incomingBookings.filter(b => b.status === "pending").length
  const pendingSent = sentBookings.filter(b => b.status === "pending").length

  return (
    <main className="min-h-screen bg-background relative">
      <ReviewModal 
        booking={reviewingBooking}
        isOpen={!!reviewingBooking}
        onClose={() => setReviewingBooking(null)}
        onSuccess={() => {
          if (reviewingBooking) {
            setSentBookings(prev => prev.map(b => b.id === reviewingBooking.id ? { ...b, reviewed: true } : b))
            setIncomingBookings(prev => prev.map(b => b.id === reviewingBooking.id ? { ...b, reviewed: true } : b))
          }
        }}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 md:w-[500px] h-96 md:h-[500px] bg-gradient-to-br from-apple-blue/10 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Booking Requests</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-secondary/60 w-fit">
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "sent" 
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-4 h-4" />
            My Bookings
            {pendingSent > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold">{pendingSent}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "incoming" 
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Venue Requests
            {pendingIncoming > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-bold">{pendingIncoming}</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {currentBookings.length === 0 ? (
          <div className="p-12 rounded-[32px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border/50 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {activeTab === "incoming" ? "No Venue Requests" : "No Bookings Yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              {activeTab === "incoming" 
                ? "Post a venue and then wait for a request and that request will be shown there. Once a request is accepted, the guest will have 1 hour to complete the payment."
                : "When you request to book a venue, your bookings will appear here so you can track their status."
              }
            </p>
            {activeTab === "incoming" && (
              <Link 
                href="/list-your-space" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0a0f1e] text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
              >
                <Plus className="w-5 h-5" />
                List Your Space
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {currentBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showActions={activeTab === "incoming"}
                isSent={activeTab === "sent"}
                processingId={processingId}
                onAction={handleAction}
                onCancel={handleCancel}
                onPay={handlePay}
                onTimeout={handleTimeout}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
