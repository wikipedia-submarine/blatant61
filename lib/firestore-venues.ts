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
  limit,
} from "firebase/firestore"
import { getDb } from "./firestore"
import { logEvent } from "./firestore-events"

export type VenueStatus = "pending" | "approved" | "rejected"

export interface FirestoreVenue {
  id?: string
  userId: string
  spaceName: string
  location: string
  description: string
  price: number
  maxGuests: number
  amenities: string[]
  contact?: string
  contactPhone?: string
  contactEmail?: string
  images: string[]
  videos: string[]
  category: "apartments" | "villas" | "rooftops" | "studios"
  status: VenueStatus
  createdAt: Timestamp | Date
  submittedBy: string 
  submittedById: string 
  reviewedAt?: Timestamp | Date
  reviewedBy?: string 
  reviewedById?: string 
  rejectionReason?: string
  availability?: number[] 
  availableDates?: string[] 
}

export interface VenueFormData {
  spaceName: string
  location: string
  description: string
  price: string
  maxGuests: string
  amenities: string[]
  contact?: string
  contactPhone?: string
  contactEmail?: string
  category: string
  images: string[]
  videos: string[]
  availability?: number[]
  availableDates?: string[]
}

export async function submitVenue(
  formData: VenueFormData,
  userId: string,
  userEmail: string,
  userName: string = "",
  imageUrls: string[] = [],
  videoUrls: string[] = []
): Promise<string> {
  const db = getDb()

  const venueData: Omit<FirestoreVenue, "id"> = {
    userId,
    spaceName: formData.spaceName,
    location: formData.location,
    description: formData.description,
    price: parseFloat(formData.price),
    maxGuests: parseInt(formData.maxGuests),
    amenities: formData.amenities,
    contact: formData.contact || "",
    contactPhone: formData.contactPhone || "",
    contactEmail: formData.contactEmail || "",
    category: formData.category as "apartments" | "villas" | "rooftops" | "studios",
    images: imageUrls,
    videos: videoUrls,
    status: "pending",
    createdAt: serverTimestamp() as unknown as Timestamp,
    submittedBy: userName || userEmail,
    submittedById: userId,
    availability: formData.availability || [0, 1, 2, 3, 4, 5, 6], 
    availableDates: formData.availableDates || [], 
  }

  const docRef = await addDoc(collection(db, "venues"), venueData)
  
  await logEvent(
    "Venue Submitted",
    `${userName || userEmail} submitted a new venue: "${formData.spaceName}".`
  )

  return docRef.id
}

export async function getPendingVenues(): Promise<FirestoreVenue[]> {
  const db = getDb()
  const q = query(collection(db, "venues"), where("status", "==", "pending"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    reviewedAt: doc.data().reviewedAt,
  } as FirestoreVenue))
}

export async function getApprovedVenues(limitCount?: number): Promise<FirestoreVenue[]> {
  const db = getDb()
  let q = query(
    collection(db, "venues"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
  )
  
  if (limitCount) {
    q = query(q, limit(limitCount))
  }
  
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    reviewedAt: doc.data().reviewedAt,
  } as FirestoreVenue))
}

export async function getRejectedVenues(): Promise<FirestoreVenue[]> {
  const db = getDb()
  const q = query(
    collection(db, "venues"),
    where("status", "==", "rejected")
  )
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    reviewedAt: doc.data().reviewedAt,
  } as FirestoreVenue))
}

export async function getVenueById(venueId: string): Promise<FirestoreVenue | null> {
  const db = getDb()
  const docRef = doc(db, "venues", venueId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt,
    reviewedAt: docSnap.data().reviewedAt,
  } as FirestoreVenue
}

export async function approveVenue(
  venueId: string,
  adminId: string,
  adminEmail: string
): Promise<void> {
  const db = getDb()
  const docRef = doc(db, "venues", venueId)

  const venueSnap = await getDoc(docRef)
  const venueName = venueSnap.exists() ? venueSnap.data().spaceName : venueId

  await updateDoc(docRef, {
    status: "approved",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
    reviewedById: adminId,
  })

  await logEvent("Venue Approved", `Admin ${adminEmail} approved venue "${venueName}".`)
}

export async function rejectVenue(
  venueId: string,
  adminId: string,
  adminEmail: string,
  rejectionReason: string
): Promise<void> {
  const db = getDb()
  const docRef = doc(db, "venues", venueId)

  const venueSnap = await getDoc(docRef)
  const venueName = venueSnap.exists() ? venueSnap.data().spaceName : venueId

  await updateDoc(docRef, {
    status: "rejected",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
    reviewedById: adminId,
    rejectionReason,
  })

  await logEvent("Venue Rejected", `Admin ${adminEmail} rejected venue "${venueName}". Reason: ${rejectionReason}`)
}

export async function getUserVenues(userId: string): Promise<FirestoreVenue[]> {
  const db = getDb()
  const q = query(
    collection(db, "venues"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  )
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
    reviewedAt: doc.data().reviewedAt,
  } as FirestoreVenue))
}

import { staticVenuesData } from "./static-venues"

export async function getVenuesByIds(ids: string[]): Promise<FirestoreVenue[]> {
  if (!ids || ids.length === 0) return []
  
  const staticIds = ids.filter(id => !isNaN(Number(id)))
  const firestoreIds = ids.filter(id => isNaN(Number(id)))
  
  const firestorePromises = firestoreIds.map(id => getVenueById(id))
  const firestoreResults = await Promise.all(firestorePromises)
  const firestoreVenues = firestoreResults.filter((v): v is FirestoreVenue => v !== null)
  
  const staticVenues = staticVenuesData
    .filter(sv => staticIds.includes(sv.id.toString()))
    .map(sv => ({
      id: sv.id.toString(),
      spaceName: sv.nameKey, 
      location: sv.locationKey,
      price: sv.price,
      maxGuests: sv.guests,
      description: sv.description,
      amenities: sv.amenities,
      images: sv.images || [sv.image],
      status: "approved",
      createdAt: new Date(), 
      submittedBy: "System",
      submittedById: "system",
      category: "apartments", 
    } as FirestoreVenue))
  
  return [...firestoreVenues, ...staticVenues]
}

export async function updateVenueAdmin(
  venueId: string,
  updates: Partial<FirestoreVenue>
): Promise<void> {
  const db = getDb()
  const docRef = doc(db, "venues", venueId)
  
  const { id, ...validUpdates } = updates as any
  
  const venueSnap = await getDoc(docRef)
  const venueName = venueSnap.exists() ? venueSnap.data().spaceName : venueId

  await updateDoc(docRef, {
    ...validUpdates,
    updatedAt: serverTimestamp(),
  })

  await logEvent("Venue Updated", `Internal system/admin updated venue "${venueName}".`)
}

export async function cancelVenueRequest(venueId: string): Promise<void> {
  const db = getDb()
  const { deleteDoc } = await import("firebase/firestore")
  const docRef = doc(db, "venues", venueId)
  
  const venueSnap = await getDoc(docRef)
  if (venueSnap.exists() && venueSnap.data().status === "pending") {
    const venueName = venueSnap.data().spaceName
    await deleteDoc(docRef)
    await logEvent("Venue Request Cancelled", `User cancelled venue upload request for "${venueName}".`)
  }
}

export async function deleteVenueListing(venueId: string): Promise<void> {
  const db = getDb()
  const { deleteDoc } = await import("firebase/firestore")
  const docRef = doc(db, "venues", venueId)
  
  const venueSnap = await getDoc(docRef)
  if (venueSnap.exists()) {
    const venueName = venueSnap.data().spaceName
    await deleteDoc(docRef)
    await logEvent("Venue Listing Deleted", `User deleted their venue listing: "${venueName}".`)
  }
}
