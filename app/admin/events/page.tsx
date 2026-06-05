"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader, Activity, Clock, Trash2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protectedRoute"
import { getLatestEvents, logEvent, deleteAllEvents, type FirestoreEventItem } from "@/lib/firestore-events"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminEventsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEventsContent />
    </ProtectedRoute>
  )
}

const EVENT_COLOR: Record<string, string> = {
  "Booking Accepted":  "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  "Booking Denied":    "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  "Booking Requested": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Booking Cancelled": "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
  "Venue Approved":    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Venue Rejected":    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  "Venue Deleted":     "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  "Venue Updated":     "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "default":           "bg-accent/10 text-accent border-accent/30",
}

function getEventColor(action: string) {
  return EVENT_COLOR[action] || EVENT_COLOR["default"]
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function AdminEventsContent() {
  const [events, setEvents] = useState<FirestoreEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLatestEvents()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEvents()
    setRefreshing(false)
  }

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to clear all activity logs? This cannot be undone.")) return

    try {
      setLoading(true)
      await deleteAllEvents()
      await logEvent("Logs Cleared", `Administrator cleared all activity logs.`)
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear logs")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    } catch { return iso }
  }

  return (
    <main className="min-h-screen bg-background pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Activity Log</h1>
            <p className="text-muted-foreground">Last 20 platform events: bookings, approvals, changes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh logs"
              className="p-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground border border-foreground/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={loading || events.length === 0}
              title="Clear all logs"
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-foreground/10 hover:bg-foreground/15 text-foreground border border-foreground/20 hover:border-foreground/40 transition-all font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
          <Activity className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            This log automatically captures the <span className="font-semibold text-foreground">latest 20 events</span> on the platform: venue approvals/rejections, booking status changes, and admin modifications. Older entries are removed as new ones come in.
          </p>
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
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No events logged yet.</p>
            <p className="text-muted-foreground/60 text-sm mt-2">Events will appear here once admins take actions or users submit bookings.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />

            <AnimatePresence>
              <div className="space-y-4 pl-16">
                {events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="relative"
                  >
                    <div className="absolute -left-[2.75rem] top-4 w-3 h-3 rounded-full bg-accent border-2 border-background shadow-sm" />

                    <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300">
                      <div className="flex flex-wrap items-start gap-3 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getEventColor(event.action)}`}>
                          {event.action}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          <span title={formatTimestamp(event.timestamp)}>{timeAgo(event.timestamp)}</span>
                          <span className="hidden sm:inline text-muted-foreground/40">·</span>
                          <span className="hidden sm:inline">{formatTimestamp(event.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{event.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            <p className="text-xs text-muted-foreground/50 text-center mt-8">
              Showing last {events.length} of max 20 events. Older entries are automatically removed.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
