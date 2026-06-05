"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader, Phone, Mail, User, Calendar, Check, X, Clock, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protectedRoute"
import { getAllBookingRequests, updateBookingStatus, deleteBooking, type FirestoreBooking, type BookingStatus } from "@/lib/firestore-bookings"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminBookingRequestsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminBookingRequestsContent />
    </ProtectedRoute>
  )
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  denied: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
  timeout: "bg-red-500/10 text-red-600 border-red-500/20",
}

const STATUS_ICONS: Record<BookingStatus, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  accepted: <Check className="w-3.5 h-3.5" />,
  denied: <X className="w-3.5 h-3.5" />,
  cancelled: <X className="w-3.5 h-3.5" />,
  timeout: <Clock className="w-3.5 h-3.5" />,
}

function AdminBookingRequestsContent() {
  const { user, userProfile } = useAuth()
  const [bookings, setBookings] = useState<FirestoreBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<BookingStatus | "all">("all")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadAllBookings()
  }, [])

  const loadAllBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllBookingRequests()
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus, booking: FirestoreBooking) => {
    setProcessing(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
      setBookings(prev => prev.map(b => b.id === bookingId ? { 
        ...b, 
        status: newStatus,
        ...(newStatus === "accepted" ? { acceptedAt: new Date() } : {})
      } : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking")
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this booking request? This cannot be undone.")) return
    
    setProcessing(bookingId)
    try {
      await deleteBooking(bookingId)
      setBookings(prev => prev.filter(b => b.id !== bookingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete booking")
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      let d: Date
      if (typeof date === "object" && "seconds" in date) d = new Date(date.seconds * 1000)
      else d = new Date(date)
      if (isNaN(d.getTime())) return "Invalid Date"
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    } catch { return "Invalid Date" }
  }

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter)

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    denied: bookings.filter(b => b.status === "denied").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  }

  return (
    <main className="min-h-screen bg-background pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">All Booking Requests</h1>
            <p className="text-muted-foreground">Platform-wide rental requests from all users</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground/10 hover:bg-foreground/15 text-foreground border border-foreground/20 hover:border-foreground/40 transition-all font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {(["all", "pending", "accepted", "denied", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 capitalize ${
                filter === tab
                  ? "bg-accent text-white border-accent"
                  : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg font-medium">No {filter !== "all" ? filter : ""} bookings found.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filteredBookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {booking.venueImage && (
                      <div className="w-full md:w-32 h-32 md:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        <img src={booking.venueImage} alt={booking.venueName} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-foreground truncate">{booking.venueName}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[booking.status]}`}>
                          {STATUS_ICONS[booking.status]}
                          {booking.status === "accepted" && booking.paid ? "PAID & CONFIRMED" : booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate font-medium">{booking.buyerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{booking.buyerEmail}</span>
                        </div>
                        {booking.buyerPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{booking.buyerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{booking.dates?.length ?? 0} night{booking.dates?.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span>Total: ${booking.totalPrice}</span>
                          {booking.paid && (
                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded ml-2 uppercase">Paid</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted: {formatDate(booking.createdAt)}
                        </div>
                      </div>

                      {booking.dates && booking.dates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {booking.dates.sort().slice(0, 6).map(d => (
                            <span key={d} className="px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent text-xs font-bold">
                              {new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          ))}
                          {booking.dates.length > 6 && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold">
                              +{booking.dates.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 flex-shrink-0">
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking.id!, "accepted", booking)}
                            disabled={processing === booking.id}
                            className="flex items-center justify-center p-2 rounded-xl bg-green-500/15 hover:bg-green-500 text-green-700 hover:text-white transition-all disabled:opacity-50"
                            title="Accept"
                          >
                            {processing === booking.id ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id!, "denied", booking)}
                            disabled={processing === booking.id}
                            className="flex items-center justify-center p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-white transition-all disabled:opacity-50"
                            title="Deny"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDeleteBooking(booking.id!)}
                        disabled={processing === booking.id}
                        className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all disabled:opacity-50 group"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </main>
  )
}
