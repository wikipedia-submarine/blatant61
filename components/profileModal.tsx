"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Camera, Calendar, Star, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const EXAMPLE_REVIEWS = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    text: "Amazing space! Perfect for our birthday party. The host was very welcoming and everything was clean.",
    date: "2 weeks ago"
  },
  {
    id: 2,
    author: "Mike T.",
    rating: 5,
    text: "Great venue at a reasonable price. The lighting is perfect and plenty of space for dancing!",
    date: "1 month ago"
  }
]

const EXAMPLE_VENUES = [
  {
    id: 1,
    title: "Downtown Rooftop Lounge",
    location: "Downtown",
    price: "$250/hour",
    image: "/images/profile/downtown-rooftop-lounge.jpg",
    rating: 4.8
  },
  {
    id: 2,
    title: "Modern Apartment with View",
    location: "Midtown",
    price: "$180/hour",
    image: "/images/profile/modern-apartment-view.jpg",
    rating: 4.6
  }
]

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, userProfile, updateProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [displayName, setDisplayName] = useState(userProfile?.displayName || "")
  const [bio, setBio] = useState(userProfile?.bio || "")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "")
      setBio(userProfile.bio || "")
      setPhotoPreview(null)
    }
  }, [userProfile, isOpen])

  if (!user) return null

  const handleClose = () => {
    setDisplayName(userProfile?.displayName || "")
    setBio(userProfile?.bio || "")
    setPhotoPreview(null)
    onClose()
  }

  const displayNameValue = displayName || userProfile?.displayName || user.email?.split("@")[0] || "User"
  const initials = displayNameValue
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPhotoPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: any = {}
      if (displayName && displayName !== userProfile?.displayName) {
        updates.displayName = displayName
      }
      if (bio !== (userProfile?.bio || "")) {
        updates.bio = bio
      }
      if (photoPreview) {
        updates.photoURL = photoPreview
      }

      if (Object.keys(updates).length > 0 && updateProfile) {
        await updateProfile(updates)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const createdDate = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown"

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              className="relative bg-card rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-border/30"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="relative z-10 flex items-center justify-between p-6 border-b border-border/20 bg-card/95 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-foreground">Edit My Profile</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 border-b border-border/20">
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <Avatar className="h-36 w-36 cursor-pointer shadow-lg">
                          <AvatarImage src={photoPreview || userProfile?.photoURL || undefined} alt={displayNameValue} />
                          <AvatarFallback className="bg-gradient-to-br from-accent to-blue-600 text-white text-3xl font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-8 h-8 text-white" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 p-3 rounded-full bg-accent text-white hover:bg-accent/90 transition-colors shadow-lg"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-4 py-3 text-2xl font-bold rounded-2xl border-2 border-border/50 bg-secondary/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="Your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                        <input
                          type="email"
                          value={user.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-2xl border-2 border-border/50 bg-secondary/50 text-muted-foreground cursor-not-allowed opacity-60"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-2xl bg-secondary/30 border border-border/30 w-fit">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Join Date: {createdDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-b border-border/20">
                  <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide text-muted-foreground">About You</h4>
                  <div className="space-y-2">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-border/50 bg-secondary/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                      placeholder="Tell people about yourself... (This will appear on your profile)"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/500 characters</p>
                  </div>
                </div>

                <div className="p-8 border-b border-border/20">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-foreground">Reviews</h4>
                    <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {EXAMPLE_REVIEWS.map((review) => (
                      <div key={review.id} className="p-5 rounded-2xl bg-secondary/30 border border-border/30 space-y-3 hover:border-accent/30 transition-all">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-base text-foreground">{review.author}</p>
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                        <p className="text-xs text-muted-foreground font-medium">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-t border-border/20">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-foreground">Venues Posted</h4>
                    <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50">
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {EXAMPLE_VENUES.map((venue) => (
                      <div key={venue.id} className="rounded-2xl overflow-hidden border border-border/30 bg-card hover:border-accent/50 transition-all shadow-sm hover:shadow-md">
                        <div className="relative h-48 bg-gradient-to-br from-accent/20 to-blue-600/20 flex items-center justify-center text-muted-foreground overflow-hidden">
                          <img 
                            src={venue.image} 
                            alt={venue.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-5 space-y-3">
                          <div>
                            <h5 className="font-semibold text-foreground text-base leading-tight">{venue.title}</h5>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{venue.location}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/20">
                            <p className="text-base font-bold text-accent">{venue.price}</p>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-accent text-accent" />
                              <span className="text-sm font-semibold text-foreground">{venue.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex gap-4 p-8 border-t border-border/20 bg-card/95 backdrop-blur-sm">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-border/50 text-foreground font-semibold hover:bg-secondary/50 hover:border-border transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null
}
