import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { getDb } from "./firestore"

export interface UserProfile {
  uid: string
  displayName?: string
  email?: string
  bio?: string
  location?: string
  profileImage?: string
  createdAt: any
  savedVenueIds?: string[]
  pinnedVenueIds?: string[]
}

/**
 * Toggle a venue ID in the user's saved venues list
 * Returns the new saved status and the full updated list of saved venue IDs
 */
export async function toggleSavedVenue(userId: string, venueId: string): Promise<{ isSaved: boolean, updatedIds: string[] }> {
  const db = getDb()
  const userDocRef = doc(db, "users", userId)
  
  const userDoc = await getDoc(userDocRef)
  if (!userDoc.exists()) {
    throw new Error("User profile not found")
  }
  
  const userData = userDoc.data()
  const savedVenueIds = userData.savedVenueIds || []
  const isCurrentlySaved = savedVenueIds.includes(venueId)
  let updatedIds: string[]
  
  if (isCurrentlySaved) {
    updatedIds = savedVenueIds.filter((id: string) => id !== venueId)
    await updateDoc(userDocRef, {
      savedVenueIds: arrayRemove(venueId)
    })
    return { isSaved: false, updatedIds }
  } else {
    updatedIds = [...savedVenueIds, venueId]
    await updateDoc(userDocRef, {
      savedVenueIds: arrayUnion(venueId)
    })
    return { isSaved: true, updatedIds }
  }
}

/**
 * Get saved venue IDs for a user
 */
export async function getSavedVenueIds(userId: string): Promise<string[]> {
  const db = getDb()
  const userDocRef = doc(db, "users", userId)
  const userDoc = await getDoc(userDocRef)
  
  if (!userDoc.exists()) {
    return []
  }
  
  return userDoc.data().savedVenueIds || []
}

/**
 * Get a user's profile data
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const db = getDb()
  const userDocRef = doc(db, "users", userId)
  const userDoc = await getDoc(userDocRef)
  
  if (!userDoc.exists()) {
    // Return a default profile for new/inactive users
    return { 
      uid: userId, 
      displayName: "User", 
      createdAt: new Date(),
      pinnedVenueIds: [],
      savedVenueIds: []
    } as UserProfile
  }
  
  return { uid: userId, ...userDoc.data() } as UserProfile
}

/**
 * Update a user's profile data
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const db = getDb()
  const userDocRef = doc(db, "users", userId)
  
  const userDoc = await getDoc(userDocRef)
  if (!userDoc.exists()) {
    // Create the doc if it doesn't exist
    await setDoc(userDocRef, {
      ...data,
      uid: userId,
      createdAt: new Date()
    })
  } else {
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date()
    })
  }
}
