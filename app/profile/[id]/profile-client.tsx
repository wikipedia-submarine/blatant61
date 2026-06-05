"use client"

import { useLanguage } from '@/lib/language-context'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Users, Star, Calendar, Check, X, Clock, DollarSign, User as UserIcon, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getPosterBookings, updateBookingStatus, type FirestoreBooking } from '@/lib/firestore-bookings'
import { toast } from 'sonner' // Assuming sonner is used, if not I'll check

interface UserProfile {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  bio?: string
  createdAt?: string
}

interface ProfileClientProps {
  profile: UserProfile
  venues: any[]
}

export default function ProfileClient({ profile, venues }: ProfileClientProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<FirestoreBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const isOwner = user?.uid === profile.uid

  useEffect(() => {
    if (isOwner) {
      loadBookings()
    }
  }, [isOwner, profile.uid])

  const loadBookings = async () => {
    setLoadingBookings(true)
    try {
      const data = await getPosterBookings(profile.uid)
      setBookings(data)
    } catch (error) {
      console.error("Error loading bookings:", error)
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleStatusUpdate = async (bookingId: string, status: 'accepted' | 'denied') => {
    setActioningId(bookingId)
    try {
      await updateBookingStatus(bookingId, status)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
      // Mock toast if sonner isn't setup
      console.log(`Booking ${status}`)
    } catch (error) {
      console.error(`Error updating booking to ${status}:`, error)
    } finally {
      setActioningId(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12"
      >
        {/* Profile Header */}
        <motion.div 
          variants={itemVariants}
          className="relative rounded-[32px] overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/40 dark:border-slate-700/40 shadow-xl p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
              <Image
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
                alt={profile.displayName || "User"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                  {profile.displayName || profile.email?.split('@')[0]}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'recently'}
                </p>
              </div>
              {profile.bio && (
                <p className="max-w-2xl text-base md:text-lg text-foreground/80 leading-relaxed italic">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Booking Requests (Owner Only) */}
        {isOwner && (
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t.hero.bookingRequests}
              </h2>
              <div className="px-4 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-sm">
                {bookings.filter(b => b.status === 'pending').length} {t.hero.pending}
              </div>
            </div>

            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {bookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="group relative rounded-[24px] border border-border/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative w-full md:w-32 aspect-video md:aspect-square rounded-2xl overflow-hidden flex-shrink-0">
                      <Image
                        src={booking.venueImage || "/images/venues/default.jpg"}
                        alt={booking.venueName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{booking.venueName}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <UserIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{booking.buyerName} ({booking.buyerEmail})</span>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                          booking.status === 'pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          booking.status === 'accepted' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                          'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {booking.status === 'pending' ? t.hero.pending : 
                           booking.status === 'accepted' ? t.hero.accepted : 
                           t.hero.denied}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-border/40">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.hero.dates}</p>
                          <div className="flex items-center gap-2 text-foreground font-semibold">
                            <Clock className="w-4 h-4 text-accent" />
                            <span className="text-sm">
                              {booking.dates[0]} - {booking.dates[booking.dates.length - 1]}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.hero.totalPrice}</p>
                          <div className="flex items-center gap-2 text-foreground font-bold">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-lg">${booking.totalPrice}</span>
                          </div>
                        </div>
                        {booking.status === 'pending' && (
                          <div className="col-span-2 md:col-span-1 flex items-center gap-3 pt-2 md:pt-0">
                            <button
                              onClick={() => handleStatusUpdate(booking.id!, 'accepted')}
                              disabled={actioningId !== null}
                              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
                            >
                              {actioningId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              {t.hero.accept}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id!, 'denied')}
                              disabled={actioningId !== null}
                              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                              {actioningId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                              {t.hero.deny}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 dark:bg-white/5 rounded-[32px] p-12 text-center border border-dashed border-border/60">
                <p className="text-lg text-muted-foreground">{t.hero.noRequests}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* User's Venues */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Spaces posted by {profile.displayName || profile.email?.split('@')[0]}
            </h2>
            <div className="px-4 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-sm">
              {venues.length} listings
            </div>
          </div>

          {venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {venues.map((venue) => (
                <Link 
                  key={venue.id} 
                  href={`/venues/${venue.id}`}
                  className="group relative rounded-[28px] border border-border/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={venue.images?.[0] || "/images/venues/default.jpg"}
                      alt={venue.spaceName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                      {venue.spaceName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{venue.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{venue.maxGuests} guests</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">${venue.price}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">per night</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/5 rounded-[32px] p-12 text-center border border-dashed border-border/60">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">This user hasn't posted any venues yet.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
