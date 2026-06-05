"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, UserProfile } from "@/lib/firestore-users"
import { getUserVenues } from "@/lib/firestore-venues"
import { getHostReviews, FirestoreReview } from "@/lib/firestore-reviews"
import { getImageFromFirestore } from "@/lib/cloud-storage"
import { ArrowLeft, MapPin, Calendar, Mail, Edit3, Loader2, Star, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"

export default function PublicProfilePage() {
  const params = useParams()
  const uid = params.id as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [reviews, setReviews] = useState<FirestoreReview[]>([])
  const [loading, setLoading] = useState(true)
  const isOwner = user?.uid === uid

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch profile first
        const profileData = await getUserProfile(uid)
        setProfile(profileData)

        // Then try to fetch venues and reviews (don't let them block the profile)
        try {
          const userVenues = await getUserVenues(uid)
          
          // Resolve images for venues
          const resolvedVenues = await Promise.all(
            userVenues.map(async (v) => {
              let firstImg = v.images && v.images.length > 0 ? v.images[0] : (v.image || "")
              if (firstImg.startsWith("firestore://")) {
                try {
                  const imageId = firstImg.replace("firestore://", "")
                  const resolved = await getImageFromFirestore(imageId)
                  if (resolved) firstImg = resolved
                } catch (e) {
                  console.error("Error resolving venue image:", e)
                }
              }
              return { ...v, resolvedImage: firstImg }
            })
          )
          
          setVenues(resolvedVenues)
          
          // Infer name if it's still default
          if (profileData.displayName === "User" && userVenues.length > 0) {
            setProfile(prev => prev ? { ...prev, displayName: userVenues[0].submittedBy || "User" } : prev)
          }
        } catch (vError: any) {
          console.error("Error loading venues:", vError)
          // If it's a permission error, we just keep venues empty rather than crashing
          if (vError.code === "permission-denied") {
            setVenues([])
          }
        }

        try {
          const userReviews = await getHostReviews(uid)
          setReviews(userReviews)
        } catch (rError: any) {
          console.error("Error loading reviews:", rError)
          if (rError.code === "permission-denied") {
            setReviews([])
          }
        }

      } catch (error) {
        console.error("Critical error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }
    if (uid) loadData()
  }, [uid])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">User not found</h1>
        <p className="text-muted-foreground mb-8">The profile you are looking for does not exist or could not be loaded.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-accent text-white font-bold hover:scale-105 transition-all">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background relative pt-32 pb-20 px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/" className="p-2 rounded-full hover:bg-secondary transition-colors text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">User Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-border/50 shadow-xl relative overflow-hidden">
              <div className="relative flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-accent/20">
                  {profile.profileImage ? (
                    <Image src={profile.profileImage} alt={profile.displayName || "User"} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">
                  {profile.displayName || "Anonymous User"}
                </h2>
                <p className="text-muted-foreground text-sm font-medium mb-6">
                  Member since {profile.createdAt ? format(profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt), "MMMM yyyy") : "recently"}
                </p>

                {isOwner && (
                  <Link 
                    href="/profile/edit"
                    className="w-full py-3 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Link>
                )}

                <div className="w-full pt-8 mt-8 border-t border-border/40 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span>{profile.location || "Earth"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-accent" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[40px] bg-secondary/30 border border-border/30">
              <h3 className="font-bold text-foreground mb-4 uppercase tracking-widest text-xs">About Me</h3>
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio || "No bio added yet."}
              </p>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-8">
                {profile.displayName?.split(' ')[0]}'s Spaces
              </h2>
              {venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pinned Venues First */}
                  {[...venues]
                    .sort((a, b) => {
                      const aPinned = profile?.pinnedVenueIds?.includes(a.id) ? 1 : 0
                      const bPinned = profile?.pinnedVenueIds?.includes(b.id) ? 1 : 0
                      return bPinned - aPinned
                    })
                    .map((venue) => (
                      <Link key={venue.id} href={`/venues/${venue.id}`} className="group block relative">
                        {profile?.pinnedVenueIds?.includes(venue.id) && (
                          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            Pinned
                          </div>
                        )}
                        <div className="rounded-[32px] overflow-hidden bg-white dark:bg-slate-900 border border-border/50 shadow-md hover:shadow-xl transition-all duration-500">
                        <div className="relative aspect-video bg-secondary/20">
                          <img 
                            src={venue.resolvedImage || "/images/venues/skyline-penthouse.jpg"} 
                            alt={venue.spaceName || venue.nameKey || "Venue"} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/venues/skyline-penthouse.jpg"
                            }}
                          />
                        </div>
                        <div className="p-6">
                          <h4 className="font-bold text-foreground mb-2 truncate">{venue.spaceName || venue.nameKey}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {venue.rating || "5.0"}
                            </span>
                            <span>${venue.price}/night</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 rounded-[40px] border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">No venues listed yet.</p>
                </div>
              )}
            </div>

            {/* Host Reviews */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Guest Reviews</h2>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-bold text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-border/50 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                            {review.reviewerImage ? (
                              <img src={review.reviewerImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{review.reviewerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {review.createdAt ? format(review.createdAt.toDate ? review.createdAt.toDate() : new Date(review.createdAt), "MMM d, yyyy") : "Recently"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3 h-3 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-border"}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed italic">
                        &quot;{review.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 rounded-[40px] border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground font-medium">No reviews yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">Reviews from guests will appear here after their stay.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
