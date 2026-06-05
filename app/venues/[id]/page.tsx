import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { getTranslation } from "@/lib/i18n"
import { VenueDetailsClient } from "./venue-details-client"
import { getVenueById, getApprovedVenues } from "@/lib/firestore-venues"
import { getImageFromFirestore } from "@/lib/cloud-storage"

import { staticVenuesData } from "@/lib/static-venues"

// Note: generateStaticParams is not needed with SSR mode (output: export removed)
// Pages render on-demand when requested instead of at build time

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const venueId = parseInt(id)

  // First check static venues
  const staticVenue = staticVenuesData.find((v) => v.id === venueId)

  if (staticVenue) {
    const t = getTranslation("en")
    return {
      title: `${t.venueData[staticVenue.nameKey]} - Event Venue`,
      description: staticVenue.description,
    }
  }

  // Check Firestore if not in static data
  try {
    const firestoreVenue = await getVenueById(id)
    if (firestoreVenue) {
      return {
        title: `${firestoreVenue.spaceName} - Event Venue`,
        description: firestoreVenue.description,
      }
    }
  } catch (error) {
    console.error("Error fetching venue metadata:", error)
  }

  return { title: "Venue Not Found" }
}

// Resolve Firestore image URLs to actual image data
async function resolveVenueImages(images: string[]): Promise<string[]> {
  return Promise.all(
    images.map(async (image) => {
      if (image.startsWith("firestore://")) {
        try {
          const imageId = image.replace("firestore://", "")
          const imageData = await getImageFromFirestore(imageId)
          return imageData || image // Return original if retrieval fails
        } catch (error) {
          console.error(`Error retrieving image ${image}:`, error)
          return image // Return original on error
        }
      }
      return image
    })
  )
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // First check static venues - use string comparison for the ID
  const staticVenue = staticVenuesData.find((v) => v.id.toString() === id)
  let venue: any = staticVenue
  let isFirestoreVenue = false

  // If not found in static data, fetch from Firestore
  if (!venue) {
    try {
      const firestoreVenue = await getVenueById(id)
      if (!firestoreVenue) {
        notFound()
      }

      isFirestoreVenue = true
      // Create a plain object for serialization to client component
      venue = { ...firestoreVenue }

      // Resolve Firestore images if needed
      if (venue.images && Array.isArray(venue.images)) {
        venue.images = await resolveVenueImages(venue.images)
      }

      // Ensure dates are serializable (strings) for the Client Component
      if (venue.createdAt) {
        if (typeof (venue.createdAt as any).toDate === 'function') {
          venue.createdAt = (venue.createdAt as any).toDate().toISOString()
        } else if (venue.createdAt instanceof Date) {
          venue.createdAt = venue.createdAt.toISOString()
        } else {
          venue.createdAt = String(venue.createdAt)
        }
      }

      if (venue.reviewedAt) {
        if (typeof (venue.reviewedAt as any).toDate === 'function') {
          venue.reviewedAt = (venue.reviewedAt as any).toDate().toISOString()
        } else if (venue.reviewedAt instanceof Date) {
          venue.reviewedAt = venue.reviewedAt.toISOString()
        } else {
          venue.reviewedAt = String(venue.reviewedAt)
        }
      }

      // Fetch poster's actual display name from Firestore profile
      if (venue.submittedById) {
        try {
          const { doc, getDoc } = await import("firebase/firestore")
          const { getDb } = await import("@/lib/firestore")
          const { isUserAdmin } = await import("@/lib/admins")
          
          const db = getDb()
          const userDoc = await getDoc(doc(db, "users", venue.submittedById))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            // Check if this user is an admin
            if (isUserAdmin(venue.submittedById, userData.email || venue.submittedBy)) {
              venue.submittedBy = "FESTIVO Host"
            } else if (userData.displayName) {
              venue.submittedBy = userData.displayName
            }
          } else {
            // Fallback for admin check if profile missing but they are in the hardcoded list
            if (isUserAdmin(venue.submittedById, venue.submittedBy)) {
              venue.submittedBy = "FESTIVO Host"
            }
          }
        } catch (e) {
          console.warn("Failed to fetch poster profile:", e)
        }
      }
    } catch (error) {
      console.error("Error fetching venue:", error)
      notFound()
    }
  }

  return (
    <>
      <Header />
      <VenueDetailsClient venue={venue} isFirestoreVenue={isFirestoreVenue} />
    </>
  )
}
