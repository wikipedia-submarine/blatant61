"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { getUserVenues, FirestoreVenue } from "@/lib/firestore-venues"
import { getPosterBookings, FirestoreBooking } from "@/lib/firestore-bookings"
import { getHostReviews, FirestoreReview } from "@/lib/firestore-reviews"
import { 
  BarChart3, 
  DollarSign, 
  Star, 
  Calendar, 
  ArrowLeft, 
  Loader2,
  Activity,
  CreditCard,
  Clock,
  CheckCircle2,
  Building2,
  Globe,
  PieChart,
  Target,
  MapPin,
  Users,
  ExternalLink,
  ChevronRight,
  Home
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Timestamp } from "firebase/firestore"

type ViewMode = "landing" | "global" | "venue-select" | "venue-detail"

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [venues, setVenues] = useState<FirestoreVenue[]>([])
  const [allBookings, setAllBookings] = useState<FirestoreBooking[]>([])
  const [allReviews, setAllReviews] = useState<FirestoreReview[]>([])
  
  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>("landing")
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/sign-in")
      return
    }

    async function loadAnalytics() {
      try {
        console.log("Analytics: Loading for user", user.uid)
        const [userVenues, userBookings, userReviews] = await Promise.all([
          getUserVenues(user!.uid),
          getPosterBookings(user!.uid),
          getHostReviews(user!.uid)
        ])
        
        console.log("Analytics: Data fetched", { 
          totalVenues: userVenues.length,
          approved: userVenues.filter(v => v.status === "approved").length,
          bookings: userBookings.length 
        })

        setVenues(userVenues)
        setAllBookings(userBookings)
        setAllReviews(userReviews)
      } catch (error) {
        console.error("Error loading analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [user, authLoading, router])

  // Filtered Data Logic
  const currentBookings = useMemo(() => {
    if (viewMode === "global") return allBookings
    if (viewMode === "venue-detail" && selectedVenueId) {
      return allBookings.filter(b => b.venueId === selectedVenueId)
    }
    return []
  }, [allBookings, viewMode, selectedVenueId])

  const currentReviews = useMemo(() => {
    if (viewMode === "global") return allReviews
    if (viewMode === "venue-detail" && selectedVenueId) {
      return allReviews.filter(r => r.venueId === selectedVenueId)
    }
    return []
  }, [allReviews, viewMode, selectedVenueId])

  const currentVenue = useMemo(() => {
    if (viewMode === "venue-detail" && selectedVenueId) {
      return venues.find(v => v.id === selectedVenueId)
    }
    return null
  }, [venues, selectedVenueId, viewMode])

  // Filter only approved venues for selection - CRITICAL LOGIC
  const approvedVenues = useMemo(() => {
    return venues.filter(v => v.status === "approved" && (v.userId === user?.uid || v.submittedById === user?.uid))
  }, [venues, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    )
  }

  // Statistics Calculation
  const totalRevenue = currentBookings
    .filter(b => b.paid)
    .reduce((sum, b) => sum + b.totalPrice, 0)
  
  const avgRating = currentReviews.length > 0
    ? currentReviews.reduce((sum, r) => sum + r.rating, 0) / currentReviews.length
    : 0

  const pendingCount = currentBookings.filter(b => b.status === "pending").length
  const awaitingPayCount = currentBookings.filter(b => b.status === "accepted" && !b.paid).length
  const confirmedCount = currentBookings.filter(b => b.status === "accepted" && b.paid).length

  const getMonthlyRevenue = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mIdx = d.getMonth()
      const year = d.getFullYear()
      const total = currentBookings
        .filter(b => {
          if (!b.paid) return false
          const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt)
          return bDate.getMonth() === mIdx && bDate.getFullYear() === year
        })
        .reduce((sum, b) => sum + b.totalPrice, 0)
      result.push({ name: months[mIdx], total })
    }
    return result
  }

  const chartData = getMonthlyRevenue()
  const maxVal = Math.max(...chartData.map(d => d.total), 1)

  const stats = [
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Bookings", value: currentBookings.length.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "N/A", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
    { 
      label: viewMode === "global" ? "Active" : "Guests", 
      value: viewMode === "global" ? approvedVenues.length.toString() : (currentVenue?.maxGuests?.toString() || "0"), 
      icon: viewMode === "global" ? Building2 : Users, color: "text-purple-600", bg: "bg-purple-50" 
    }
  ]

  // --- LANDING VIEW ---
  if (viewMode === "landing") {
    return (
      <main className="min-h-screen bg-[#FDFDFD] py-24 md:py-32 px-6 flex items-center justify-center relative">
        <div className="absolute top-8 left-8">
           <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors">
              <Home className="w-4 h-4" />
              Back to Home
           </Link>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,95,127,0.03),transparent_70%)]" />
        <div className="max-w-5xl w-full relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 text-accent font-bold text-xs uppercase tracking-[0.2em] border border-accent/10">
              Host Analytics Portal
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 uppercase">Select Your <span className="text-accent">Perspective</span></h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl mx-auto mb-16">Choose between overall performance or individual venue tracking.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                onClick={() => setViewMode("global")}
                className="group p-10 rounded-[40px] bg-white border border-slate-200 hover:border-accent hover:shadow-2xl hover:shadow-accent/5 transition-all text-left relative overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-accent/10 text-accent mb-6 w-fit group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">Global Analytics</h3>
                <p className="text-slate-500 font-medium">Aggregated performance data across all your active venues.</p>
                <div className="mt-8 flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-widest">
                  View Overall
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
              
              <button 
                onClick={() => setViewMode("venue-select")}
                className="group p-10 rounded-[40px] bg-white border border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all text-left relative overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 mb-6 w-fit group-hover:scale-110 transition-transform">
                  <PieChart className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">Specific Venues</h3>
                <p className="text-slate-500 font-medium">Drill down into data for a specific property listed on the site.</p>
                <div className="mt-8 flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest">
                  Select Venue
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  if (viewMode === "venue-select") {
    return (
      <main className="min-h-screen bg-[#FDFDFD] py-24 md:py-32 px-6 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => setViewMode("landing")} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest group transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">Active <span className="text-blue-600">Venues</span></h2>
            <p className="text-slate-500 font-medium mt-2">Showing only approved venues currently live on the platform.</p>
          </div>
          
          {approvedVenues.length === 0 ? (
            <div className="p-20 text-center bg-white border border-slate-200 rounded-[40px]">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No approved venues found for your account.</p>
              <p className="text-slate-400 text-sm mt-2">Venues appear here once they are accepted by the administrator.</p>
              <Link href="/list-your-space" className="text-accent hover:underline font-bold text-sm mt-6 inline-block">List a new space</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {approvedVenues.map((v, i) => (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedVenueId(v.id!)
                    setViewMode("venue-detail")
                  }}
                  className="group rounded-[32px] bg-white border border-slate-200 p-5 hover:border-blue-500 hover:shadow-xl transition-all"
                >
                  <div className="aspect-[4/3] rounded-[24px] overflow-hidden relative mb-5">
                    <img src={v.images?.[0] || "/images/venues/default.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{v.spaceName}</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{v.location}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  // --- ANALYTICS DASHBOARD ---
  return (
    <main className="min-h-screen bg-[#FDFDFD] py-24 md:py-32 px-6 relative transition-colors duration-500">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setViewState(viewMode === "global" ? "landing" : "venue-select")} 
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {viewMode === "global" ? "Perspective Selection" : "Venue Grid"}
              </button>
              <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest group">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                {viewMode === "global" ? <Globe className="w-8 h-8 text-accent" /> : <Activity className="w-8 h-8 text-blue-600" />}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-none">
                  {viewMode === "global" ? "Global Analytics" : "Venue Analytics"}
                </h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
                  {viewMode === "global" ? "Aggregated Portfolio Data" : currentVenue?.spaceName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Stats Cards */}
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label + viewMode + selectedVenueId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-6"
            >
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} w-fit`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
            </motion.div>
          ))}

          {/* Chart Area */}
          <div className="lg:col-span-3 p-8 md:p-12 rounded-[48px] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-16">
               <div>
                 <h3 className="text-2xl font-bold text-slate-900 uppercase">Revenue Analytics</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Trailing 6 Months</p>
               </div>
               <p className="text-4xl font-black text-accent tracking-tighter">${totalRevenue.toLocaleString()}</p>
             </div>
             
             <div className="h-[280px] flex items-end justify-between gap-4 sm:gap-8 px-4">
                {chartData.map((m, i) => {
                  const h = (m.total / maxVal) * 100
                  return (
                    <div key={m.name} className="flex-1 flex flex-col items-center gap-6 group">
                      <div className="relative w-full flex justify-center items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1.2, delay: 0.3 + (i * 0.1) }}
                          style={{ minHeight: m.total > 0 ? "8px" : "4px" }}
                          className="w-full sm:w-12 bg-accent/10 hover:bg-accent/30 rounded-2xl transition-colors relative"
                        >
                           <div className={`absolute inset-x-0 top-0 h-1 bg-accent rounded-full ${m.total > 0 ? 'opacity-100' : 'opacity-0'}`} />
                        </motion.div>
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg whitespace-nowrap z-20">
                          ${m.total.toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.name}</span>
                    </div>
                  )
                })}
             </div>
          </div>

          {/* Pipeline Sidebar */}
          <div className="lg:col-span-1 p-8 rounded-[48px] bg-white border border-slate-100 shadow-sm flex flex-col gap-10">
            <h3 className="text-lg font-bold text-slate-900 uppercase">Booking Queue</h3>
            <div className="space-y-4">
              {[
                { label: "Pending", count: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Pay Wait", count: awaitingPayCount, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Confirmed", count: confirmedCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-5 rounded-[28px] bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase">{item.label}</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Table (Global Only) */}
        {viewMode === "global" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="mt-12 p-10 rounded-[48px] bg-white border border-slate-100 shadow-sm overflow-x-auto"
          >
            <h3 className="text-2xl font-bold text-slate-900 uppercase mb-10">Property Performance</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 pb-6">Venue</th>
                  <th className="px-6 pb-6">Bookings</th>
                  <th className="px-6 pb-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {approvedVenues.map(v => {
                   const rev = allBookings.filter(b => b.venueId === v.id && b.paid).reduce((s, b) => s + b.totalPrice, 0)
                   const bCount = allBookings.filter(b => b.venueId === v.id).length
                   return (
                    <tr key={v.id} className="border-b border-slate-50 last:border-none">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl overflow-hidden">
                              <img src={v.images[0]} className="w-full h-full object-cover" alt="" />
                           </div>
                           <span className="font-bold text-slate-900">{v.spaceName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-bold text-slate-500">{bCount}</td>
                      <td className="px-6 py-6 text-right font-black text-xl text-slate-900">${rev.toLocaleString()}</td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </main>
  )
}
