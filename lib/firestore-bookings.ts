import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from "firebase/firestore"
import { getDb } from "./firestore"
import { logEvent } from "./firestore-events"

export type BookingStatus = "pending" | "accepted" | "denied" | "cancelled" | "timeout"

export interface FirestoreBooking {
  id?: string
  venueId: string
  venueName: string
  venueImage: string
  posterId: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  dates: string[]
  totalPrice: number
  status: BookingStatus
  createdAt: Timestamp | Date
  acceptedAt?: Timestamp | Date
  paid?: boolean
  paidAt?: Timestamp | Date
  reviewed?: boolean
  timeout?: boolean
}

export async function createBookingRequest(bookingData: Omit<FirestoreBooking, "id" | "createdAt" | "status">): Promise<string> {
  const db = getDb()
  const bookingsRef = collection(db, "bookings")
  const newBooking = {
    ...bookingData,
    status: "pending" as BookingStatus,
    createdAt: serverTimestamp(),
  }
  const docRef = await addDoc(bookingsRef, newBooking)
  await logEvent(
    "Booking Requested",
    `${bookingData.buyerName} (${bookingData.buyerPhone}) requested "${bookingData.venueName}" for ${bookingData.dates.length} night${bookingData.dates.length !== 1 ? "s" : ""}.`
  )
  return docRef.id
}

export async function getPosterBookings(posterId: string): Promise<FirestoreBooking[]> {
  const db = getDb()
  const q = query(
    collection(db, "bookings"),
    where("posterId", "==", posterId)
  )
  const querySnapshot = await getDocs(q)
  const bookings = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreBooking))
  return bookings.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
    const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function getBuyerBookings(buyerId: string): Promise<FirestoreBooking[]> {
  const db = getDb()
  const q = query(
    collection(db, "bookings"),
    where("buyerId", "==", buyerId)
  )
  const querySnapshot = await getDocs(q)
  const bookings = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreBooking))
  return bookings.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
    const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const db = getDb()
  const bookingRef = doc(db, "bookings", bookingId)
  const bookingSnap = await getDoc(bookingRef)
  const bookingData = bookingSnap.exists() ? bookingSnap.data() : null
  const venueName = bookingData?.venueName || "Unknown Venue"
  const buyerName = bookingData?.buyerName || "Unknown Guest"
  const updateData: any = {
    status,
    updatedAt: Timestamp.fromDate(new Date()),
  }
  
  if (status === "accepted") {
    updateData.acceptedAt = Timestamp.fromDate(new Date())
  }

  await updateDoc(bookingRef, updateData)
  const actionLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const phoneSuffix = bookingData?.buyerPhone ? ` (${bookingData.buyerPhone})` : ""
  await logEvent(`Booking ${actionLabel}`, `Booking for "${venueName}" by ${buyerName}${phoneSuffix} was ${status}.`)
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const db = getDb()
  const bookingRef = doc(db, "bookings", bookingId)
  const bookingSnap = await getDoc(bookingRef)
  const bookingData = bookingSnap.exists() ? bookingSnap.data() : null
  const venueName = bookingData?.venueName || "Unknown Venue"
  await updateDoc(bookingRef, {
    status: "cancelled" as BookingStatus,
    cancelledAt: serverTimestamp(),
  })
  await logEvent("Booking Cancelled", `The booking for "${venueName}" was cancelled.`)
}

export async function getAcceptedBookingsForVenue(venueId: string): Promise<FirestoreBooking[]> {
  const db = getDb()
  const q = query(
    collection(db, "bookings"),
    where("venueId", "==", venueId),
    where("status", "==", "accepted")
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreBooking))
}

export async function markBookingAsPaid(bookingId: string): Promise<void> {
  const db = getDb()
  const bookingRef = doc(db, "bookings", bookingId)
  await updateDoc(bookingRef, {
    paid: true,
    paidAt: serverTimestamp(),
  })
  await logEvent("Booking Paid", `Payment completed for booking ${bookingId}.`)
}

export async function checkBookingTimeout(booking: FirestoreBooking): Promise<boolean> {
  if (booking.status !== "accepted" || booking.paid) return false
  if (!booking.acceptedAt) return false

  let acceptedAt: Date | null = null
  
  if (booking.acceptedAt instanceof Timestamp) {
    acceptedAt = booking.acceptedAt.toDate()
  } else if (booking.acceptedAt instanceof Date) {
    acceptedAt = booking.acceptedAt
  } else if (typeof booking.acceptedAt === 'object' && 'seconds' in (booking.acceptedAt as any)) {
    acceptedAt = new Date((booking.acceptedAt as any).seconds * 1000)
  } else if (typeof booking.acceptedAt === 'string' || typeof booking.acceptedAt === 'number') {
    acceptedAt = new Date(booking.acceptedAt)
  }
  
  console.log(`[DEBUG TIMEOUT] Booking ${booking.id}: acceptedAt parsed as`, acceptedAt, "Raw:", booking.acceptedAt);

  if (!acceptedAt || isNaN(acceptedAt.getTime())) {
    console.log(`[DEBUG TIMEOUT] Booking ${booking.id}: INVALID DATE. Returning false.`);
    return false
  }

  const now = new Date()
  const elapsed = now.getTime() - acceptedAt.getTime()
  
  console.log(`[DEBUG TIMEOUT] Booking ${booking.id}: Elapsed ms:`, elapsed);

  if (elapsed < 2 * 60 * 1000) {
    console.log(`[DEBUG TIMEOUT] Booking ${booking.id}: Within 2 min grace period. Returning false.`);
    return false
  }
  
  const threeHours = 3 * 60 * 60 * 1000
  
  if (elapsed > threeHours) {
    console.log(`[DEBUG TIMEOUT] Booking ${booking.id}: EXCEEDED 3 HOURS. Timing out.`);
    try {
      const db = getDb()
      const bookingRef = doc(db, "bookings", booking.id!)
      await updateDoc(bookingRef, {
        status: "timeout" as BookingStatus,
      })
      await logEvent("Booking Timeout", `Booking ${booking.id} timed out due to lack of payment.`)
    } catch (err) {
      console.error("Failed to update booking timeout:", err)
    }
    return true
  }
  
  return false
}

export async function getAllBookingRequests(): Promise<FirestoreBooking[]> {
  const db = getDb()
  const q = query(collection(db, "bookings"))
  const querySnapshot = await getDocs(q)
  const bookings = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreBooking))
  return bookings.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
    const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
    return bTime - aTime
  })
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const db = getDb()
  const bookingRef = doc(db, "bookings", bookingId)
  await deleteDoc(bookingRef)
  await logEvent("Booking Deleted", `Booking ${bookingId} was manually deleted by an admin.`)
}
