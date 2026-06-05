"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, AlertCircle, Loader } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protectedRoute"
import { useLanguage } from "@/lib/language-context"
import { VenueEditModal } from "@/components/VenueEditModal"
import { approveVenue, rejectVenue, getPendingVenues, updateVenueAdmin, type FirestoreVenue } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"

export default function AdminVenuesPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminVenuesContent />
    </ProtectedRoute>
  )
}

function AdminVenuesContent() {
  const { t } = useLanguage()
  const { user, userProfile } = useAuth()
  const [venues, setVenues] = useState<FirestoreVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingVenue, setEditingVenue] = useState<FirestoreVenue | null>(null)

  useEffect(() => {
    loadPendingVenues()
  }, [])

  const loadPendingVenues = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPendingVenues()
      
      // Resolve Firestore images for each venue
      const resolvedVenues = await Promise.all(data.map(async (venue) => {
        if (venue.images && venue.images.length > 0) {
          const resolvedImages = await Promise.all(venue.images.map(async (img) => {
            if (img.startsWith("firestore://")) {
              try {
                const imageId = img.replace("firestore://", "")
                const resolved = await getImageFromFirestore(imageId)
                return resolved || img
              } catch (e) {
                console.error(`Error resolving image ${img}:`, e)
                return img
              }
            }
            return img
          }))
          return { ...venue, images: resolvedImages }
        }
        return venue
      }))
      
      setVenues(resolvedVenues)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load pending venues"
      setError(errorMessage)
      console.error("Error loading venues:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (venueId: string) => {
    if (!user || !userProfile) return

    setProcessing(venueId)
    try {
      await approveVenue(venueId, user.uid, userProfile.email || "")
      setVenues(venues.filter((v) => v.id !== venueId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to approve venue"
      setError(errorMessage)
      console.error("Error approving venue:", err)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (venueId: string) => {
    if (!user || !userProfile) return
    if (!rejectionReason[venueId]?.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    setProcessing(venueId)
    try {
      await rejectVenue(venueId, user.uid, userProfile.email || "", rejectionReason[venueId])
      setVenues(venues.filter((v) => v.id !== venueId))
      setRejectionReason((prev) => {
        const updated = { ...prev }
        delete updated[venueId]
        return updated
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reject venue"
      setError(errorMessage)
      console.error("Error rejecting venue:", err)
    } finally {
      setProcessing(null)
    }
  }

  const handleUpdate = async (venueId: string, updates: Partial<FirestoreVenue>) => {
    setProcessing(venueId)
    try {
      await updateVenueAdmin(venueId, updates)
      setVenues(venues.map(v => v.id === venueId ? { ...v, ...updates } : v))
      setEditingVenue(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update venue"
      setError(errorMessage)
      console.error("Error updating venue:", err)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      let d: Date
      if (date instanceof Date) {
        d = date
      } else if (typeof date === 'object' && date && 'seconds' in date) {
        d = new Date((date as any).seconds * 1000)
      } else {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) return "Invalid Date"
        d = parsed
      }
      return d.toLocaleDateString() + " " + d.toLocaleTimeString()
    } catch (e) {
      return "Invalid Date"
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 relative z-10 pt-24 sm:pt-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Venue Moderation</h1>
            <p className="text-muted-foreground">Review and approve pending venue submissions</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground/10 hover:bg-foreground/15 text-foreground border border-foreground/20 hover:border-foreground/40 transition-all duration-300 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-apple-red/10 border border-apple-red/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-apple-red flex-shrink-0 mt-0.5" />
            <p className="text-apple-red font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : venues.length === 0 ? (
          <div className="p-12 rounded-2xl border-2 border-dashed border-border text-center">
            <p className="text-muted-foreground text-lg">No pending venues to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground mb-4">
              {venues.length} pending venue{venues.length !== 1 ? "s" : ""} for review
            </div>

            {venues.map((venue) => (
              <div
                key={venue.id}
                className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-border/40 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-6">
                  {venue.images.length > 0 && (
                    <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={venue.images[0]}
                        alt={venue.spaceName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{venue.spaceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {venue.submittedBy} on {formatDate(venue.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedVenueId(expandedVenueId === venue.id ? null : venue.id)
                        }
                        className="text-accent hover:text-accent/80 transition-colors font-semibold text-sm"
                      >
                        {expandedVenueId === venue.id ? "Hide" : "Show"} details
                      </button>
                    </div>

                    {expandedVenueId === venue.id && (
                      <div className="space-y-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Location
                            </p>
                            <p className="text-foreground">{venue.location}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Price & Capacity
                            </p>
                            <p className="text-foreground">
                              ${venue.price}/night • Up to {venue.maxGuests} guests
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Contact
                            </p>
                            <div className="text-foreground text-sm space-y-1">
                              {venue.contactPhone && (
                                <p className="flex items-center gap-2">
                                  <span className="font-semibold">Phone:</span> {venue.contactPhone}
                                </p>
                              )}
                              {venue.contactEmail && (
                                <p className="flex items-center gap-2">
                                  <span className="font-semibold">Email:</span> {venue.contactEmail}
                                </p>
                              )}
                              {!venue.contactPhone && !venue.contactEmail && <p>{venue.contact || "N/A"}</p>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Amenities
                            </p>
                            <p className="text-foreground">
                              {venue.amenities.length > 0 ? venue.amenities.join(", ") : "None"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Description
                          </p>
                          <p className="text-foreground text-sm leading-relaxed">{venue.description}</p>
                        </div>

                        {venue.reviewedAt && (
                          <div className="pt-4 border-t border-border/30">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Review History
                            </p>
                            <div className="space-y-2 text-sm">
                              <p className="text-foreground">
                                <span className="font-semibold">Reviewed by:</span> {venue.reviewedBy}
                              </p>
                              <p className="text-foreground">
                                <span className="font-semibold">Reviewed on:</span> {formatDate(venue.reviewedAt)}
                              </p>
                              <p className="text-foreground">
                                <span className="font-semibold">Status:</span>{" "}
                                <span className={venue.status === "approved" ? "text-green-600" : "text-apple-red"}>
                                  {venue.status === "approved" ? "Approved" : "Rejected"}
                                </span>
                              </p>
                              {venue.rejectionReason && (
                                <div className="pt-2 border-t border-border/30">
                                  <p className="font-semibold mb-1 text-foreground">Rejection Reason:</p>
                                  <p className="text-foreground bg-muted/20 rounded p-2">{venue.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {venue.images.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Photos ({venue.images.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {venue.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`${venue.spaceName} ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setEditingVenue(venue)}
                          className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-accent text-white font-semibold transition-all duration-300 hover:bg-accent/90"
                        >
                          Edit Venue Details
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(venue.id!)}
                          disabled={processing === venue.id}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-400 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === venue.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            setExpandedVenueId(
                              expandedVenueId === `${venue.id}-reject` ? null : `${venue.id}-reject`
                            )
                          }
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-apple-red/20 hover:bg-apple-red/30 text-apple-red font-semibold transition-all duration-300"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>

                      {expandedVenueId === `${venue.id}-reject` && (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Provide a reason for rejection (required)"
                            value={rejectionReason[venue.id!] || ""}
                            onChange={(e) =>
                              setRejectionReason((prev) => ({
                                ...prev,
                                [venue.id!]: e.target.value,
                              }))
                            }
                            className="w-full p-3 rounded-lg border border-border/60 bg-white/90 dark:bg-slate-800/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-apple-red/50 resize-none"
                            rows={3}
                          />
                          <button
                            onClick={() => handleReject(venue.id!)}
                            disabled={processing === venue.id}
                            className="w-full py-2 px-4 rounded-lg bg-apple-red hover:bg-apple-red/90 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === venue.id ? "Rejecting..." : "Confirm Rejection"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingVenue && (
        <VenueEditModal
          venue={editingVenue}
          onClose={() => setEditingVenue(null)}
          onSave={(updates) => handleUpdate(editingVenue.id!, updates)}
          isProcessing={processing === editingVenue.id}
        />
      )}
    </main>
  )
}

