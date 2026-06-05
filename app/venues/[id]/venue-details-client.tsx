"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Users, Zap, Wifi, UtensilsCrossed, Heart, Star, ChevronLeft, ChevronRight, Phone, Mail, User, ArrowLeft, Share, Home, Wind, ShieldCheck, Clock, Map, BedDouble, Bath, Square, ChevronRight as ArrowRight } from "lucide-react"
import { useState, useMemo, useCallback, useTransition, memo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { toggleSavedVenue } from "@/lib/firestore-users"
import { createBookingRequest, getAcceptedBookingsForVenue, type FirestoreBooking } from "@/lib/firestore-bookings"
import { VenueReviews } from "@/components/venueReviews"
import { X, Calendar as CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { format, isSameDay, isAfter, isBefore, addDays, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, getDay, isSameMonth, startOfDay } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

const AMENITIES_MAP = {
  wifi: { icon: Wifi, label: "WiFi" },
  kitchen: { icon: UtensilsCrossed, label: "Kitchen" },
  heating: { icon: Zap, label: "Heating" },
  air_conditioning: { icon: Wind, label: "Air conditioning" },
  pool: { icon: Home, label: "Pool" }, // fallback icon
  parking: { icon: MapPin, label: "Free parking" },
}

interface StaticVenue {
  id: number
  nameKey: "skylinePenthouse" | "gardenVilla" | "rooftopTerrace" | "loftStudio" | "seasideVilla" | "mountainRetreat"
  locationKey: "vakeTbilisi" | "saburtaloTbilisi" | "oldTownTbilisi" | "veraTbilisi" | "batumi" | "borjomi"
  price: number
  guests: number
  latitude: number
  longitude: number
  image: string
  images?: string[]
  description: string
  amenities: string[]
  premium?: boolean
}

interface FirestoreVenue {
  id?: string
  userId: string
  spaceName: string
  location: string
  price: string | number
  maxGuests: string | number
  description: string
  amenities: string[]
  contact: string
  images: string[]
  videos?: string[]
  availability?: number[]
  availableDates?: string[]
}

type Venue = StaticVenue | FirestoreVenue

interface Props {
  venue: Venue
  isFirestoreVenue?: boolean
}

const MemoizedChevronLeft = memo(ChevronLeft)
const MemoizedChevronRight = memo(ChevronRight)
const MemoizedX = memo(X)
const MemoizedCalendarIcon = memo(CalendarIcon)
const MemoizedPhone = memo(Phone)
const MemoizedLoader2 = memo(Loader2)
const MemoizedAlertCircle = memo(AlertCircle)

const DayCell = memo(({ 
  date, 
  disabled, 
  selected, 
  onClick, 
  isToday 
}: { 
  date: Date; 
  disabled: boolean; 
  selected: boolean; 
  onClick: (date: Date) => void;
  isToday: boolean;
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick(date);
  }, [onClick, date]);

  const dayNum = date.getDate();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`
        aspect-square flex items-center justify-center text-sm font-bold rounded-xl relative
        transition-[transform,color] duration-200 ease-out
        ${disabled 
          ? 'text-gray-400 line-through cursor-not-allowed italic opacity-30' 
          : 'text-[#1a1a1c] hover:bg-black/5 hover:scale-110 active:scale-95'
        }
        ${selected ? 'text-white scale-105 z-10' : ''}
        ${isToday && !selected ? 'border-2 border-black/20' : ''}
      `}
      style={{ 
        transform: 'translateZ(0)',
        backgroundColor: selected ? '#111111' : 'transparent'
      }}
    >
      <div 
        className={`absolute inset-0 rounded-xl bg-[#111111] shadow-lg shadow-black/20 -z-10 transition-opacity duration-200 pointer-events-none ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ transform: 'translateZ(0)' }}
      />
      {dayNum}
    </button>
  );
});

DayCell.displayName = "DayCell";

const CalendarGrid = memo(({ 
  days, 
  isDateDisabled, 
  isDateSelected, 
  handleDateClick 
}: { 
  days: (Date | null)[];
  isDateDisabled: (date: Date) => boolean;
  isDateSelected: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
}) => {
  const today = useMemo(() => new Date(), []);
  
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
        <div key={day} className="text-center text-[10px] font-black text-[#1a1a1c]/60 uppercase py-2">
          {day}
        </div>
      ))}
      
      {days.map((date, idx) => {
        if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
        
        return (
          <DayCell
            key={date.getTime()}
            date={date}
            disabled={isDateDisabled(date)}
            selected={isDateSelected(date)}
            onClick={handleDateClick}
            isToday={isSameDay(date, today)}
          />
        );
      })}
    </div>
  );
});

CalendarGrid.displayName = "CalendarGrid";

const CalendarHeader = memo(({ 
  calendarMonth, 
  currentMonth, 
  onToggleMonth, 
  getMonthName 
}: { 
  calendarMonth: Date;
  currentMonth: Date;
  onToggleMonth: (direction: 1 | -1) => void;
  getMonthName: (date: Date) => string;
}) => (
  <div className="flex items-center justify-between mb-4">
    <button 
      type="button"
      onClick={() => onToggleMonth(-1)}
      disabled={isSameMonth(calendarMonth, currentMonth)}
      className="p-3 rounded-xl border border-[#E7ECF3] hover:bg-[#F8FAFC] transition-colors disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
    >
      <MemoizedChevronLeft className="w-5 h-5 text-[#111111]" />
    </button>
    <h4 className="text-lg font-bold text-[#111111]">
      {getMonthName(calendarMonth)} {calendarMonth.getFullYear()}
    </h4>
    <button 
      type="button"
      onClick={() => onToggleMonth(1)}
      disabled={isSameMonth(calendarMonth, addMonths(currentMonth, 1))}
      className="p-3 rounded-xl border border-[#E7ECF3] hover:bg-[#F8FAFC] transition-colors disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
    >
      <MemoizedChevronRight className="w-5 h-5 text-[#111111]" />
    </button>
  </div>
));

CalendarHeader.displayName = "CalendarHeader";

const BookingModalPortal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[95vh] relative z-10"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const BookingModalContent = memo(({ 
  venue, 
  isFirestoreVenue, 
  user, 
  userProfile, 
  t, 
  router, 
  onClose,
  venuePrice,
  venueName,
  images
}: { 
  venue: any; 
  isFirestoreVenue: boolean; 
  user: any; 
  userProfile: any; 
  t: any; 
  router: any; 
  onClose: () => void;
  venuePrice: number;
  venueName: string;
  images: string[];
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [acceptedBookings, setAcceptedBookings] = useState<any[]>([]);

  const currentMonth = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isFirestoreVenue) return;
      const venueId = (venue as FirestoreVenue).id;
      if (!venueId) return;
      try {
        const bookings = await getAcceptedBookingsForVenue(venueId);
        setAcceptedBookings(bookings);
      } catch (err) {
        console.debug("Availability info unavailable:", err);
      }
    };
    fetchAvailability();
  }, [venue.id, isFirestoreVenue]);

  const bookedDatesSet = useMemo(() => {
    const set = new Set<string>();
    acceptedBookings.forEach(booking => {
      booking.dates.forEach(d => set.add(d));
    });
    return set;
  }, [acceptedBookings]);

  const availableDatesSet = useMemo(() => {
    if (!isFirestoreVenue || !venue.availableDates) return null;
    return new Set(venue.availableDates);
  }, [venue.availableDates, isFirestoreVenue]);

  const isDateDisabled = useCallback((date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (availableDatesSet) {
      if (!availableDatesSet.has(dateStr)) return true;
    } else {
      const weekdayAvailability = venue.availability || [0, 1, 2, 3, 4, 5, 6];
      if (!weekdayAvailability.includes(date.getDay())) return true;
    }
    return bookedDatesSet.has(dateStr);
  }, [bookedDatesSet, availableDatesSet, venue.availability]);

  const handleDateClick = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  }, []);

  const daysInMonthGrid = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const paddingCount = startDay === 0 ? 6 : startDay - 1;
    const padding = Array(paddingCount).fill(null);
    return [...padding, ...days];
  }, [calendarMonth]);

  const isDateSelected = useCallback((date: Date) => {
    return selectedDates.includes(format(date, 'yyyy-MM-dd'));
  }, [selectedDates]);

  const toggleMonth = useCallback((direction: 1 | -1) => {
    setCalendarMonth(prev => addMonths(prev, direction));
  }, []);

  const getMonthName = useCallback((date: Date) => {
    const monthsKeys = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const key = monthsKeys[date.getMonth()];
    return t.months[key as keyof typeof t.months];
  }, [t.months]);

  const handleBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (selectedDates.length === 0) {
      setBookingError(t.venues.bookingModal.selectDates);
      return;
    }
    if (!buyerPhone.trim()) {
      setBookingError("Please provide a contact phone number.");
      return;
    }
    setIsBooking(true);
    setBookingError(null);
    try {
      const totalPrice = selectedDates.length * venuePrice;
      const venueId = isFirestoreVenue ? venue.id : venue.id.toString();
      await createBookingRequest({
        venueId: venueId || "",
        venueName: venueName || "Unnamed Venue",
        venueImage: images?.[0] || "/images/venues/default.jpg",
        posterId: (isFirestoreVenue && venue.userId) ? venue.userId : "system",
        buyerId: user.uid,
        buyerName: userProfile?.displayName || user.displayName || user.email || "Guest",
        buyerEmail: userProfile?.email || user.email || "",
        buyerPhone: buyerPhone.trim(),
        dates: selectedDates,
        totalPrice: totalPrice || 0,
      });
      setBookingSuccess(true);
      setTimeout(() => onClose(), 3000);
    } catch (error: any) {
      const msg = error?.message || error?.code || "Unknown error";
      setBookingError(`${t.venues.bookingModal.error} (${msg})`);
    } finally {
      setIsBooking(false);
    }
  };

  const totalPrice = selectedDates.length * venuePrice;

  return (
    <div className="w-full bg-white rounded-[32px] shadow-[0_20px_60px_rgba(107,122,144,0.15)] overflow-hidden border border-[#E7ECF3] flex flex-col">
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={onClose}
          className="p-2.5 rounded-full bg-[#F8FAFC] hover:bg-[#EEF2F7] text-[#111111] transition-colors duration-200 cursor-pointer"
        >
          <MemoizedX className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 md:p-8 xl:p-10 overflow-y-auto custom-scrollbar">
        {bookingSuccess ? (
          <div className="py-20 text-center space-y-6 px-4">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-[#111111]">{t.venues.bookingModal.success}</h3>
            <p className="text-[15px] text-[#6B7A90] max-w-md mx-auto leading-relaxed">
              Wait for the host to accept the request. After they accept, you will have a 1-hour window to complete the payment.
            </p>
            <div className="pt-8">
              <Link 
                href="/profile/requests" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#111111] text-white font-bold hover:bg-black transition-colors"
              >
                Go to Requests
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#F5F7FB] border border-[#E7ECF3]">
                  <MemoizedCalendarIcon className="w-8 h-8 text-[#111111]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#111111] tracking-tight">{t.venues.bookingModal.title}</h3>
                  <p className="text-sm text-[#6B7A90]">{t.venues.bookingModal.subtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <CalendarHeader 
                  calendarMonth={calendarMonth}
                  currentMonth={currentMonth}
                  onToggleMonth={toggleMonth}
                  getMonthName={getMonthName}
                />

                <div className="p-5 rounded-[24px] bg-[#F8FAFC] border border-[#E7ECF3] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={calendarMonth.toString()}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <CalendarGrid
                        days={daysInMonthGrid}
                        isDateDisabled={isDateDisabled}
                        isDateSelected={isDateSelected}
                        handleDateClick={handleDateClick}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-6">
              <form onSubmit={handleBookingRequest} className="space-y-6 flex-1">
                <div className="p-6 rounded-[24px] bg-[#F8FAFC] border border-[#E7ECF3]">
                  <p className="text-[11px] font-bold text-[#6B7A90] uppercase tracking-wider mb-4">Selected Days</p>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDates.length > 0 ? (
                      [...selectedDates].sort().map(d => (
                        <span key={d} className="px-3 py-1.5 rounded-lg bg-white border border-[#E7ECF3] text-[#111111] text-sm font-semibold shadow-sm">
                          {format(new Date(d), "MMM dd")}
                        </span>
                      ))
                    ) : (
                      <p className="text-[#6B7A90] font-medium text-sm">No dates selected yet</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#111111]">Contact Phone Number *</label>
                  <div className="relative">
                    <MemoizedPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7A90]" />
                    <input 
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-11 pr-4 py-3.5 rounded-[14px] border border-[#E7ECF3] bg-white focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-colors text-[14px]"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-[24px] bg-[#F5F7FB] border border-[#E7ECF3] space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-[#111111]">{t.venues.bookingModal.total}</p>
                    <p className="text-3xl font-bold text-[#111111]">${totalPrice}</p>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-4 rounded-[14px] bg-red-50 border border-red-100 flex items-start gap-3">
                    <MemoizedAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 font-medium">{bookingError}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isBooking || selectedDates.length === 0}
                  className="w-full py-4 rounded-[14px] bg-[#111111] text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_4px_14px_rgba(17,17,17,0.15)] cursor-pointer"
                >
                  {isBooking ? (
                    <>
                      <MemoizedLoader2 className="w-5 h-5 animate-spin" />
                      <span>{t.venues.bookingModal.submitting}</span>
                    </>
                  ) : (
                    <span>{t.venues.requestNow}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

BookingModalContent.displayName = "BookingModalContent";

export function VenueDetailsClient({ venue, isFirestoreVenue }: Props) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const { user, isAdmin, userProfile, updateProfile } = useAuth()
  
  // Determine if this is a static or Firestore venue
  const isStatic = !isFirestoreVenue && "nameKey" in venue

  // Get the venue name
  const venueName = (isStatic ? t.venueData[(venue as StaticVenue).nameKey] : (venue as FirestoreVenue).spaceName) || "Unnamed Venue"

  // Get the location
  const venueLocation = (isStatic ? t.venueData[(venue as StaticVenue).locationKey] : (venue as FirestoreVenue).location) || "Tbilisi, Georgia"

  // Get the price
  const rawPrice = isStatic ? (venue as StaticVenue).price : Number((venue as FirestoreVenue).price)
  const venuePrice = isNaN(rawPrice) ? 0 : rawPrice

  // Get the guests
  const rawGuests = isStatic ? (venue as StaticVenue).guests : Number((venue as FirestoreVenue).maxGuests)
  const venueGuests = isNaN(rawGuests) ? 0 : rawGuests

  // Poster Info
  const rawSubmittedBy = (venue as any).submittedBy || "FESTIVO Host"
  const submittedBy = rawSubmittedBy.includes('@') ? rawSubmittedBy.split('@')[0] : rawSubmittedBy
  const submittedById = (venue as any).submittedById || null

  // Ensure images is always an array with at least one element for display
  const images = (venue.images && venue.images.length > 0) 
    ? venue.images 
    : (isStatic ? [(venue as StaticVenue).image] : ["/images/venues/default.jpg"])

  // Ensure amenities is always an array
  const amenities = venue.amenities || []

  const [isFavorite, setIsFavorite] = useState(() => {
    if (!user || !userProfile?.savedVenueIds) return false
    const venueId = isFirestoreVenue ? (venue as FirestoreVenue).id : (venue as StaticVenue).id.toString()
    return userProfile.savedVenueIds.includes(venueId || "")
  })
  
  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  const handleCloseBookingModal = useCallback(() => {
    setShowBookingModal(false)
  }, [])

  const handleSave = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    const venueId = isFirestoreVenue ? (venue as FirestoreVenue).id : (venue as StaticVenue).id.toString()
    if (!venueId) return

    try {
      const { isSaved: newSavedState, updatedIds } = await toggleSavedVenue(user.uid, venueId)
      setIsFavorite(newSavedState)
      
      await updateProfile({ savedVenueIds: updatedIds })
    } catch (error) {
      console.error("Failed to save venue:", error)
    }
  }

  const openBookingModal = () => {
    if (!user) {
      router.push('/sign-up')
      return
    }
    setShowBookingModal(true)
  }

  const handleProfileClick = () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    if (submittedById) {
      router.push(`/profile/${submittedById}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#111111] pb-24 font-sans relative">
      <BookingModalPortal isOpen={showBookingModal} onClose={handleCloseBookingModal}>
        <BookingModalContent
          venue={venue}
          isFirestoreVenue={!!isFirestoreVenue}
          user={user}
          userProfile={userProfile}
          t={t}
          router={router}
          onClose={handleCloseBookingModal}
          venuePrice={venuePrice}
          venueName={venueName}
          images={images}
        />
      </BookingModalPortal>

      {/* Top Section */}
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 pt-[104px] pb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#6B7A90] font-medium text-[14px] hover:text-[#111111] transition-colors mb-6 cursor-pointer group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to search
        </button>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight text-[#111111] mb-2">{venueName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[#6B7A90] text-[14px] font-medium">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {venueLocation}</div>
              <div className="w-1 h-1 rounded-full bg-[#E7ECF3]" />
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#111111] fill-current" /> 4.9 (28 reviews)</div>
              <div className="w-1 h-1 rounded-full bg-[#E7ECF3]" />
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Up to {venueGuests} guests</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] border border-[#E7ECF3] bg-white text-[#111111] font-semibold text-[14px] shadow-[0_2px_8px_rgba(107,122,144,0.04)] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
              <Share className="w-4 h-4" /> Share
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] border border-[#E7ECF3] bg-white text-[#111111] font-semibold text-[14px] shadow-[0_2px_8px_rgba(107,122,144,0.04)] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#4A90D9] text-[#4A90D9]" : ""}`} /> {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[300px] md:h-[450px] lg:h-[520px]">
          <div className="md:col-span-7 h-full relative rounded-[20px] md:rounded-l-[20px] md:rounded-r-[4px] overflow-hidden group cursor-pointer border border-[#E7ECF3]">
            <Image src={images[0]} alt="Hero" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" priority />
            {venue.premium && (
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-white" /> Popular
              </div>
            )}
          </div>
          <div className="hidden md:grid md:col-span-5 grid-cols-2 grid-rows-2 gap-3 h-full">
            <div className="relative rounded-[4px] overflow-hidden group cursor-pointer border border-[#E7ECF3]"><Image src={images[1] || images[0]} alt="Gallery 1" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" /></div>
            <div className="relative rounded-tr-[20px] rounded-[4px] overflow-hidden group cursor-pointer border border-[#E7ECF3]"><Image src={images[2] || images[0]} alt="Gallery 2" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" /></div>
            <div className="relative rounded-[4px] overflow-hidden group cursor-pointer border border-[#E7ECF3]"><Image src={images[3] || images[0]} alt="Gallery 3" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" /></div>
            <div className="relative rounded-br-[20px] rounded-[4px] overflow-hidden group cursor-pointer border border-[#E7ECF3]">
              <Image src={images[4] || images[0]} alt="Gallery 4" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                 <div className="w-full text-center bg-black/40 backdrop-blur-md py-2.5 rounded-xl text-white font-semibold text-[13px] border border-white/20 shadow-lg">View all photos ({images.length})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1320px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* Left Column */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* About Space */}
          <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-[#E7ECF3] shadow-[0_8px_40px_rgba(107,122,144,0.04)]">
            <h2 className="text-[20px] font-bold text-[#111111] mb-4">About this space</h2>
            <p className="text-[#6B7A90] text-[15px] leading-relaxed mb-8 max-w-3xl">
              {venue.description || "Experience elevated living in this stunning venue featuring panoramic city views, a private terrace, and elegant interiors. Perfect for events, celebrations, photo shoots, or a luxurious getaway."}
            </p>
            <div className="h-px w-full bg-[#E7ECF3] mb-8" />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center gap-3 group">
                 <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7ECF3] flex items-center justify-center text-[#6B7A90] group-hover:bg-white group-hover:shadow-sm transition-all"><Home className="w-5 h-5" /></div>
                 <div>
                   <h4 className="text-[13px] font-bold text-[#111111]">Entire venue</h4>
                   <p className="text-[12px] text-[#6B7A90] mt-0.5">You'll have the entire place</p>
                 </div>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                 <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7ECF3] flex items-center justify-center text-[#6B7A90] group-hover:bg-white group-hover:shadow-sm transition-all"><Map className="w-5 h-5" /></div>
                 <div>
                   <h4 className="text-[13px] font-bold text-[#111111]">Private terrace</h4>
                   <p className="text-[12px] text-[#6B7A90] mt-0.5">Outdoor with city panorama</p>
                 </div>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                 <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7ECF3] flex items-center justify-center text-[#6B7A90] group-hover:bg-white group-hover:shadow-sm transition-all"><Zap className="w-5 h-5" /></div>
                 <div>
                   <h4 className="text-[13px] font-bold text-[#111111]">Instant booking</h4>
                   <p className="text-[12px] text-[#6B7A90] mt-0.5">Book without waiting</p>
                 </div>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                 <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E7ECF3] flex items-center justify-center text-[#6B7A90] group-hover:bg-white group-hover:shadow-sm transition-all"><ShieldCheck className="w-5 h-5" /></div>
                 <div>
                   <h4 className="text-[13px] font-bold text-[#111111]">Free cancellation</h4>
                   <p className="text-[12px] text-[#6B7A90] mt-0.5">Cancel up to 7 days before</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-[#E7ECF3] shadow-[0_8px_40px_rgba(107,122,144,0.04)]">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-[20px] font-bold text-[#111111]">Amenities</h2>
               <button className="text-[13px] font-bold text-[#6B7A90] hover:text-[#111111] transition-colors cursor-pointer">View all ({amenities.length || 12})</button>
             </div>
             <div className="flex flex-wrap gap-y-8 gap-x-4 justify-between sm:justify-start sm:gap-x-12 px-2">
               {amenities.slice(0, 8).map(a => {
                 const am = AMENITIES_MAP[a as keyof typeof AMENITIES_MAP] || { icon: Square, label: a }
                 const Icon = am.icon
                 return (
                   <div key={a} className="flex flex-col items-center gap-3 w-[72px] text-center group">
                     <div className="w-[52px] h-[52px] rounded-full bg-[#F8FAFC] border border-[#E7ECF3] flex items-center justify-center text-[#6B7A90] group-hover:bg-white group-hover:shadow-sm transition-all">
                       <Icon className="w-5 h-5" />
                     </div>
                     <span className="text-[11px] font-bold text-[#111111] capitalize leading-tight">{am.label}</span>
                   </div>
                 )
               })}
             </div>
          </div>

          {/* Details */}
          <div className="bg-[#F8FAFC] rounded-[24px] p-6 lg:p-8 border border-[#E7ECF3] flex flex-col w-full">
             <h2 className="text-[18px] font-bold text-[#111111] mb-6">Details</h2>
             <div className="space-y-4 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Users className="w-4 h-4"/> Guest capacity</span>
                  <span className="font-bold text-[#111111]">Up to {venueGuests} guests</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><BedDouble className="w-4 h-4"/> Bedrooms</span>
                  <span className="font-bold text-[#111111]">4 bedrooms</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Square className="w-4 h-4"/> Beds</span>
                  <span className="font-bold text-[#111111]">6 beds</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Bath className="w-4 h-4"/> Bathrooms</span>
                  <span className="font-bold text-[#111111]">3 bathrooms</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Clock className="w-4 h-4"/> Check-in</span>
                  <span className="font-bold text-[#111111]">3:00 PM</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Clock className="w-4 h-4"/> Check-out</span>
                  <span className="font-bold text-[#111111]">11:00 AM</span>
                </div>
                <div className="h-px bg-[#E7ECF3]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7A90] flex items-center gap-2"><Home className="w-4 h-4"/> Property type</span>
                  <span className="font-bold text-[#111111]">Penthouse</span>
                </div>
             </div>
          </div>

          {/* Reviews Section Wrapper */}
          <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-[#E7ECF3] shadow-[0_8px_40px_rgba(107,122,144,0.04)] mb-8">
             <VenueReviews venueId={isFirestoreVenue ? venue.id : venue.id.toString()} />
          </div>
        </div>

        {/* Right Column (Sticky Booking Card) */}
        <div className="lg:col-span-5 xl:col-span-4 relative">
          <div className="sticky top-[104px] bg-white rounded-[24px] p-6 lg:p-8 border border-[#E7ECF3] shadow-[0_12px_40px_rgba(107,122,144,0.08)] flex flex-col gap-6">
            <div>
              <p className="text-[13px] font-bold text-[#111111] mb-1">Price</p>
              <div className="flex items-end gap-1.5">
                <span className="text-[36px] font-extrabold text-[#111111] leading-none">${venuePrice}</span>
                <span className="text-[14px] font-medium text-[#6B7A90] mb-1">/ night</span>
              </div>
              <p className="text-[12px] text-[#6B7A90] mt-2">Average price per night</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={openBookingModal} className="w-full py-3.5 rounded-[12px] bg-[#111111] text-white font-bold text-[15px] hover:bg-black active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(17,17,17,0.15)] cursor-pointer">
                Request to book
              </button>
              <button onClick={handleSave} className="w-full py-3.5 rounded-[12px] bg-white border border-[#E7ECF3] text-[#111111] font-semibold text-[15px] hover:bg-[#F8FAFC] active:scale-[0.98] flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#4A90D9] text-[#4A90D9]" : "text-[#6B7A90]"}`} /> {isFavorite ? "Saved" : "Save for later"}
              </button>
            </div>
            <p className="text-center text-[12px] text-[#6B7A90]">You won't be charged yet</p>

            <div className="h-px w-full bg-[#E7ECF3] my-1" />

            <div className="flex items-center gap-4 cursor-pointer hover:bg-[#F8FAFC] p-3 -mx-3 rounded-[16px] transition-colors" onClick={handleProfileClick}>
               <div className="w-12 h-12 rounded-full bg-[#F5F7FB] border border-[#E7ECF3] flex items-center justify-center">
                 <User className="w-6 h-6 text-[#6B7A90]" />
               </div>
               <div>
                 <h4 className="text-[14px] font-bold text-[#111111]">Hosted by {submittedBy}</h4>
                 <p className="text-[12px] text-[#6B7A90] mt-0.5">Superhost • 5+ venues</p>
               </div>
            </div>
            
            <div className="h-px w-full bg-[#E7ECF3] my-1" />
            
            {/* Location (Moved from left column) */}
            <div className="flex flex-col gap-3">
               <h3 className="text-[14px] font-bold text-[#111111]">Location</h3>
               <div className="w-full h-[140px] rounded-[16px] border border-[#E7ECF3] relative overflow-hidden flex items-center justify-center shadow-[0_2px_8px_rgba(107,122,144,0.04)]">
                 <Image src="/images/map.webp" alt="Map" fill className="object-cover" />
                 <MapPin className="w-6 h-6 text-[#111111] drop-shadow-md z-10 relative" />
               </div>
               <div>
                 <h4 className="text-[13px] font-bold text-[#111111]">{venueLocation}</h4>
                 <button className="text-[12px] font-bold text-[#6B7A90] hover:text-[#111111] flex items-center gap-1 mt-1 transition-colors">
                   Open in Google Maps <ArrowRight className="w-3 h-3" />
                 </button>
               </div>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  )
}
