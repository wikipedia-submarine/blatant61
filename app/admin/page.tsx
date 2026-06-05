"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Activity } from "lucide-react"
import { FirestoreVenue } from "@/lib/firestore-venues"
import { getPendingVenues, getApprovedVenues, getRejectedVenues } from "@/lib/firestore-venues"

interface VenueStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export default function AdminPage() {
  const { user, isAdmin, userProfile } = useAuth()
  const [stats, setStats] = useState<VenueStats>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [pendingVenues, setPendingVenues] = useState<FirestoreVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const pending = await getPendingVenues()
        const approved = await getApprovedVenues()
        const rejected = await getRejectedVenues()

        setPendingVenues(pending)

        const total = pending.length + approved.length + rejected.length
        setStats({
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          total: total
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin data"
        setError(message)
        console.error("Error loading admin data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAdmin])

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">You don't have permission to access the admin panel.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-32 md:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {userProfile?.displayName || user.email}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AdminCard
            title="Pending Venues"
            value={stats.pending.toString()}
            description="Awaiting approval"
            icon={<Clock className="w-8 h-8" />}
            color="bg-yellow-500"
            variant="pending"
          />
          <AdminCard
            title="Approved Venues"
            value={stats.approved.toString()}
            description="Live on platform"
            icon={<CheckCircle className="w-8 h-8" />}
            color="bg-green-500"
            variant="success"
          />
          <AdminCard
            title="Rejected Venues"
            value={stats.rejected.toString()}
            description="Not approved"
            icon={<XCircle className="w-8 h-8" />}
            color="bg-red-500"
            variant="error"
          />
          <AdminCard
            title="Total Venues"
            value={stats.total.toString()}
            description="All listings"
            icon={<AlertCircle className="w-8 h-8" />}
            color="bg-blue-500"
            variant="info"
          />
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Other Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/admin/booking-requests"
              className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Booking Requests</h3>
                <p className="text-sm text-muted-foreground">Manage all venue bookings and status</p>
              </div>
            </Link>

            <Link
              href="/admin/events"
              className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border hover:border-accent/40 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Activity Log</h3>
                <p className="text-sm text-muted-foreground">Monitor platform events and admin actions</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Pending Approval</h2>
              {stats.pending > 0 && (
                <Link
                  href="/admin/requests"
                  className="text-accent hover:text-accent/80 font-semibold text-sm"
                >
                  Review All →
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              </div>
            ) : pendingVenues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground text-sm mt-2">No pending venues to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingVenues.slice(0, 5).map((venue) => (
                  <div key={venue.id} className="p-4 rounded-xl bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200/50 dark:border-yellow-700/30 hover:border-yellow-300 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{venue.spaceName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Submitted by {venue.submittedBy}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {venue.description.substring(0, 100)}...
                        </p>
                      </div>
                      <Link
                        href={`/admin/requests`}
                        className="flex-shrink-0 px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-semibold text-sm hover:bg-yellow-500/30 transition-colors whitespace-nowrap"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: string
  variant?: "pending" | "success" | "error" | "info"
}

function AdminCard({ title, value, description, icon, color, variant = "info" }: AdminCardProps) {
  const bgColorMap = {
    pending: "from-yellow-50/30 to-orange-50/30 dark:from-yellow-900/20 dark:to-orange-900/20",
    success: "from-green-50/30 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/20",
    error: "from-red-50/30 to-pink-50/30 dark:from-red-900/20 dark:to-pink-900/20",
    info: "from-blue-50/30 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/20",
  }

  const borderColorMap = {
    pending: "border-yellow-200/50 dark:border-yellow-700/30",
    success: "border-green-200/50 dark:border-green-700/30",
    error: "border-red-200/50 dark:border-red-700/30",
    info: "border-blue-200/50 dark:border-blue-700/30",
  }

  return (
    <div className={`bg-gradient-to-br ${bgColorMap[variant]} rounded-2xl border ${borderColorMap[variant]} p-6 hover:shadow-lg transition-all`}>
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
