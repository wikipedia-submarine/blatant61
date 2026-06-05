"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Trash2, Building2, MapPin, Plus, Loader2 } from "lucide-react"
import { getUserVenues, deleteVenueListing, type FirestoreVenue } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/languageSwitcher"
import Link from "next/link"
import Image from "next/image"

type VenueStatus = "pending" | "approved" | "rejected"

async function resolveVenueImage(venue: FirestoreVenue): Promise<FirestoreVenue> {
  const firstImage = venue.images?.[0]
  if (!firstImage?.startsWith("firestore://")) return venue

  try {
    const imageId = firstImage.replace("firestore://", "")
    const resolvedUrl = await getImageFromFirestore(imageId)
    if (resolvedUrl) {
      return { ...venue, images: [resolvedUrl, ...venue.images.slice(1)] }
    }
  } catch (e) {
    console.error("Error resolving venue image:", e)
  }
  return venue
}

const STATUS_STYLES: Record<VenueStatus, string> = {
  pending:  "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
}

function StatusBadge({ status }: { status: VenueStatus }) {
  return (
    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap flex items-center gap-1.5 border ${STATUS_STYLES[status]}`}>
      {status === "pending"  && <Clock className="w-3.5 h-3.5 animate-pulse" />}
      {status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
      {status.toUpperCase()}
    </div>
  )
}

export default function VenueUploadRequestsPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [venues, setVenues] = useState<FirestoreVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) loadVenues()
  }, [user])

  async function loadVenues() {
    setLoading(true)
    try {
      const data = await getUserVenues(user!.uid)
      const resolved = await Promise.all(data.map(resolveVenueImage))
      setVenues(resolved)
    } catch (error) {
      console.error("Error loading venues:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      setProcessingId(id)
      await deleteVenueListing(id)
      setVenues((prev) => prev.filter((v) => v.id !== id))
    } catch (error) {
      console.error("Error removing venue:", error)
    } finally {
      setProcessingId(null)
      setConfirmingId(null)
    }
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
        <Link href="/sign-in" className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:opacity-90 transition-opacity">
          Sign In
        </Link>
      </div>
    )
  }

  const pendingCount = venues.filter((v) => v.status === "pending").length

  return (
    <main className="min-h-screen bg-background relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 md:w-[500px] h-96 md:h-[500px] bg-gradient-to-br from-apple-blue/10 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-full hover:bg-secondary transition-colors cursor-pointer text-foreground group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">{t.common.back || "Back"}</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">Venue Upload Requests</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 border ${
              pendingCount >= 3 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-accent/10 text-accent border-accent/20"
            }`}>
              {pendingCount} / 3 Active Requests
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {venues.length === 0 ? (
          <div className="p-12 rounded-[32px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border/50 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 uppercase">No Requests Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-8 font-medium">
              Start by listing your space. Once submitted, your requests will appear here for you to track their review status.
            </p>
            <Link
              href="/list-your-space"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0a0f1e] text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 uppercase text-xs tracking-widest"
            >
              <Plus className="w-5 h-5" />
              List Your Space
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 sm:p-8 rounded-[32px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-accent/30"
                >
                  <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                    {/* Venue image */}
                    <div className="relative w-full md:w-[240px] h-[180px] sm:h-[160px] rounded-2xl overflow-hidden flex-shrink-0 bg-secondary shadow-sm">
                      {venue.images?.[0] ? (
                        <Image src={venue.images[0]} alt={venue.spaceName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-[10px] truncate uppercase tracking-[0.2em]">{venue.category}</p>
                      </div>
                    </div>

                    {/* Venue details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-1.5">Submission Request</p>
                            <h3 className="text-2xl font-black text-foreground truncate uppercase tracking-tight leading-none">{venue.spaceName}</h3>
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mt-2">
                              <MapPin className="w-4 h-4 text-accent" />
                              <span className="truncate">{venue.location}</span>
                            </div>
                          </div>
                          <StatusBadge status={venue.status as VenueStatus} />
                        </div>

                        {venue.status === "pending" && (
                          <div className="mb-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4">
                            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-blue-700 dark:text-blue-400">Review in Progress</p>
                              <p className="text-blue-600/80 dark:text-blue-400/80 italic font-medium leading-relaxed">
                                Our team is currently verifying your space. This usually takes less than 24 hours.
                              </p>
                            </div>
                          </div>
                        )}

                        {venue.status === "rejected" && venue.rejectionReason && (
                          <div className="mb-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-red-700 dark:text-red-400">Action Required</p>
                              <p className="text-red-600/80 dark:text-red-400/80 italic font-medium leading-relaxed">{venue.rejectionReason}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-x-10 gap-y-2 pt-5 border-t border-border/30">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-1">Price</p>
                            <p className="font-black text-2xl text-foreground">
                              ${venue.price}
                              <span className="text-[10px] ml-1 font-bold text-muted-foreground/40 uppercase tracking-widest">/night</span>
                            </p>
                          </div>
                          <div className="w-px h-10 bg-border/40" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-1">Capacity</p>
                            <p className="font-bold text-base text-foreground">{venue.maxGuests} Guests</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                        {venue.status === "approved" && (
                          <>
                            <Link
                              href={`/venues/${venue.id}`}
                              className="flex-1 py-4 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer shadow-xl shadow-black/10"
                            >
                              <Building2 className="w-4 h-4" />
                              View Live Listing
                            </Link>
                            {confirmingId === venue.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRemove(venue.id!)}
                                  disabled={processingId === venue.id}
                                  className="py-4 px-5 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {processingId === venue.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                                </button>
                                <button
                                  onClick={() => setConfirmingId(null)}
                                  className="py-4 px-5 rounded-2xl bg-secondary font-black uppercase tracking-widest text-[11px] cursor-pointer"
                                >
                                  Keep
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmingId(venue.id!)}
                                className="py-4 px-6 rounded-2xl bg-red-500/5 text-red-500 font-black uppercase tracking-widest text-[11px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer border border-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {(venue.status === "pending" || venue.status === "rejected") && (
                          confirmingId === venue.id ? (
                            <div className="flex-1 flex gap-2">
                              <button
                                onClick={() => handleRemove(venue.id!)}
                                disabled={processingId === venue.id}
                                className="flex-1 py-4 px-6 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                              >
                                {processingId === venue.id ? <Loader2 className="w-4 h-4 animate-spin" /> : venue.status === "pending" ? "Cancel Request" : "Remove Record"}
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="py-4 px-6 rounded-2xl bg-secondary font-black uppercase tracking-widest text-[11px] cursor-pointer"
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingId(venue.id!)}
                              className="flex-1 py-4 px-6 rounded-2xl bg-red-500/5 text-red-500 font-black uppercase tracking-widest text-[11px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer border border-red-500/10"
                            >
                              <Trash2 className="w-5 h-5" />
                              {venue.status === "pending" ? "Cancel Request" : "Remove Record"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
