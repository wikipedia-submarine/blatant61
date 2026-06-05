import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { getDb } from "./firestore"

export interface FirestoreReview {
  id?: string
  venueId: string
  bookingId: string
  reviewerId: string
  reviewerName: string
  reviewerImage?: string
  hostId: string
  rating: number
  comment: string
  isVerified?: boolean
  createdAt: any
}

/**
 * Submit a new review for a venue
 */
export async function submitReview(reviewData: Omit<FirestoreReview, "id" | "createdAt">): Promise<string> {
  const db = getDb()
  
  // 1. Create the review document
  const reviewRef = await addDoc(collection(db, "reviews"), {
    ...reviewData,
    createdAt: serverTimestamp()
  })

  // 2. Mark the booking as reviewed
  const bookingRef = doc(db, "bookings", reviewData.bookingId)
  await updateDoc(bookingRef, {
    reviewed: true
  })

  return reviewRef.id
}

/**
 * Get all reviews for a specific venue
 */
export async function getVenueReviews(venueId: string): Promise<FirestoreReview[]> {
  const db = getDb()
  const q = query(
    collection(db, "reviews"),
    where("venueId", "==", venueId)
  )
  
  const querySnapshot = await getDocs(q)
  const reviews = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreReview))

  // Sort in memory to avoid requiring a composite index in Firestore
  return reviews.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

/**
 * Get average rating for a venue
 */
export async function getVenueStats(venueId: string, preFetchedReviews?: FirestoreReview[]): Promise<{ avgRating: number, reviewCount: number }> {
  const reviews = preFetchedReviews || await getVenueReviews(venueId)
  if (reviews.length === 0) return { avgRating: 0, reviewCount: 0 }
  
  const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0)
  return {
    avgRating: Number((totalRating / reviews.length).toFixed(1)),
    reviewCount: reviews.length
  }
}

/**
 * Get all reviews received by a host (across all their venues)
 */
export async function getHostReviews(hostId: string): Promise<FirestoreReview[]> {
  const db = getDb()
  const q = query(
    collection(db, "reviews"),
    where("hostId", "==", hostId),
    orderBy("createdAt", "desc")
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as FirestoreReview))
}
