"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, CheckCircle2, AlertCircle, Trash2, Building2, MapPin } from "lucide-react"
import { getUserVenues, cancelVenueRequest, type FirestoreVenue } from "@/lib/firestore-venues"
import { useAuth } from "@/lib/auth-context"

interface VenueRequestsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VenueRequestsModal({ isOpen, onClose }: VenueRequestsModalProps) {
  const { user } = useAuth()
  const [venues, setVenues] = useState<FirestoreVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) loadVenues()
  }, [isOpen, user])

  async function loadVenues() {
    setLoading(true)
    try {
      const data = await getUserVenues(user!.uid)
      setVenues(data)
    } catch (error) {
      console.error("Error loading venues:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelVenueRequest(id)
      setVenues((prev) => prev.filter((v) => v.id !== id))
    } catch (error) {
      console.error("Error cancelling request:", error)
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-white/10"
          >
            <div className="p-8 border-b border-border/10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Venue Upload Requests</h2>
                <p className="text-sm text-muted-foreground font-medium">Track the status of your space submissions</p>
              </div>
              <button onClick={onClose} className="p-3 rounded-2xl hover:bg-foreground/5 transition-all cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-accent/10 border-t-accent animate-spin" />
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">Loading requests...</p>
                </div>
              ) : venues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="p-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                    <Building2 className="w-16 h-16" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black tracking-tight">No Requests Yet</p>
                    <p className="text-muted-foreground max-w-xs mx-auto">Start by listing your space to see it show up here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {venues.map((venue) => (
                    <motion.div
                      key={venue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-6 group hover:border-accent/40 transition-all"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                        {venue.images?.[0] ? (
                          <img src={venue.images[0]} className="w-full h-full object-cover" alt={venue.spaceName} />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black tracking-tight truncate uppercase">{venue.spaceName}</h3>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2
                            ${venue.status === "approved" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                              venue.status === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`}
                          >
                            {venue.status === "approved" ? <CheckCircle2 className="w-3 h-3" /> :
                             venue.status === "rejected" ? <AlertCircle className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                            {venue.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                          <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {venue.location}</div>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <div>${venue.price} / night</div>
                        </div>
                      </div>

                      {venue.status === "pending" && (
                        <div className="flex items-center gap-2">
                          {confirmingId === venue.id ? (
                            <>
                              <button
                                onClick={() => handleCancel(venue.id!)}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest cursor-pointer transition-all hover:bg-red-600"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-black uppercase tracking-widest cursor-pointer transition-all"
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmingId(venue.id!)}
                              className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
