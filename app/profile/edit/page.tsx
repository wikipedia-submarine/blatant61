"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore-users"
import { getUserVenues } from "@/lib/firestore-venues"
import { ArrowLeft, Save, Loader2, Camera, MapPin, User, Info, Star, Pin, CheckCircle2, ChevronRight, Layout } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"

type Section = "basic" | "pinned"

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("basic")

  useEffect(() => {
    async function loadData() {
      if (!user) {
        if (!authLoading) router.push("/sign-in")
        return
      }
      try {
        const [profileData, userVenues] = await Promise.all([
          getUserProfile(user.uid),
          getUserVenues(user.uid)
        ])
        
        console.log("Loaded Profile:", profileData)
        console.log("Loaded Venues:", userVenues)
        
        setProfile(profileData)
        setVenues(userVenues)
      } catch (error) {
        console.error("Error loading profile:", error)
        toast.error("Error loading profile data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, authLoading, router])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserProfile(user.uid, profile)
      toast.success("Changes saved successfully!")
      router.push(`/profile/${user.uid}`)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const togglePin = (venueId: string) => {
    const currentPinned = profile.pinnedVenueIds || []
    if (currentPinned.includes(venueId)) {
      setProfile({ ...profile, pinnedVenueIds: currentPinned.filter(id => id !== venueId) })
    } else {
      if (currentPinned.length >= 3) {
        toast.error("You can only pin up to 3 venues")
        return
      }
      setProfile({ ...profile, pinnedVenueIds: [...currentPinned, venueId] })
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Connecting to database...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] relative pt-32 pb-20 px-4 sm:px-6">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-accent/5 via-transparent to-transparent rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push(`/profile/${user?.uid}`)}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-border/50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Edit Profile</h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">Manage your public identity and pinned content</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/profile/${user?.uid}`)}
              className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 text-foreground font-bold hover:bg-secondary transition-all border border-border/50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <button 
              onClick={() => setActiveSection("basic")}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${
                activeSection === "basic" 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-white dark:bg-slate-900 border border-border/50 text-foreground hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-4">
                <User className="w-5 h-5" />
                <span className="font-bold">Personal Info</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === "basic" ? "rotate-90" : ""}`} />
            </button>
            <button 
              onClick={() => setActiveSection("pinned")}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${
                activeSection === "pinned" 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-white dark:bg-slate-900 border border-border/50 text-foreground hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-4">
                <Pin className="w-5 h-5" />
                <span className="font-bold">Pinned Venues</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeSection === "pinned" ? "bg-white/20" : "bg-accent/10 text-accent"}`}>
                  {profile.pinnedVenueIds?.length || 0}/3
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === "pinned" ? "rotate-90" : ""}`} />
              </div>
            </button>
          </div>

          {/* Section Content Area */}
          <div className="lg:col-span-9">
            {activeSection === "basic" ? (
              <div className="p-8 sm:p-12 rounded-[40px] bg-white dark:bg-slate-900 border border-border/50 shadow-2xl space-y-12 animate-fade-up">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group cursor-pointer">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-accent/10 shadow-inner bg-secondary">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-3 rounded-full bg-accent text-white shadow-lg border-4 border-white dark:border-slate-900">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black text-foreground">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Real data from your database will be used to show your profile to guests.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/40">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.displayName || ""}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-border/40 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-foreground font-bold text-lg"
                      placeholder="Enter your real name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Current City</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                      <input
                        type="text"
                        value={profile.location || ""}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-secondary/30 border border-border/40 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-foreground font-bold text-lg"
                        placeholder="e.g. Tbilisi, Georgia"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Bio / Story</label>
                  <textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full h-48 px-6 py-5 rounded-3xl bg-secondary/30 border border-border/40 focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none text-foreground font-medium text-lg resize-none leading-relaxed"
                    placeholder="Share your passion for hosting..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-[40px] bg-white dark:bg-slate-900 border border-border/50 shadow-2xl space-y-10 animate-fade-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">Pinned Venues</h3>
                    <p className="text-muted-foreground font-medium mt-1">Select up to 3 spaces to display prominently. Using live data from your database.</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Pin className="w-8 h-8 fill-current" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {venues.map((v) => {
                    const isPinned = profile.pinnedVenueIds?.includes(v.id)
                    // Robust image source fetching from real data
                    const imageSrc = (v.images && v.images.length > 0) ? v.images[0] : (v.image || "/images/venues/default.jpg")
                    
                    return (
                      <button
                        key={v.id}
                        onClick={() => togglePin(v.id)}
                        className={`group relative p-6 rounded-[32px] border-2 transition-all text-left flex items-center gap-6 overflow-hidden ${
                          isPinned 
                            ? "border-accent bg-accent/5 ring-4 ring-accent/10" 
                            : "border-border/40 bg-secondary/10 hover:border-accent/40 hover:bg-secondary/20"
                        }`}
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-md bg-secondary/20">
                          <img 
                            src={imageSrc === "/images/venues/default.jpg" ? "/images/venues/skyline-penthouse.jpg" : imageSrc} 
                            alt={v.spaceName || v.nameKey} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/venues/skyline-penthouse.jpg"
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="font-black text-foreground text-lg truncate leading-tight">{v.spaceName || v.nameKey}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {v.location}
                          </p>
                        </div>
                        
                        <div className={`absolute top-1/2 -translate-y-1/2 right-6 p-2 rounded-full transition-all ${isPinned ? "bg-accent text-white scale-110" : "bg-white/50 text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      </button>
                    )
                  })}
                  {venues.length === 0 && (
                    <div className="col-span-2 py-20 text-center border-2 border-dashed border-border/40 rounded-[40px] bg-secondary/5">
                      <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-bold text-foreground">No live data found</h4>
                      <p className="text-sm text-muted-foreground mt-1">Once you list a real space in the database, it will appear here.</p>
                      <Link href="/list-your-space" className="text-accent text-sm font-bold mt-4 inline-block hover:underline">List a venue now →</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
