import { FirestoreVenue } from "./firestore-venues"
import { getAuthWithPersistence } from "./firebase"

/**
 * Fetch pending venues via server-side API (requires admin auth)
 */
export async function getPendingVenuesViaAPI(): Promise<FirestoreVenue[]> {
  try {
    const auth = await getAuthWithPersistence()
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error("User not authenticated")
    }

    // Get ID token for authorization
    const idToken = await currentUser.getIdToken(true)

    const response = await fetch("/api/admin/pending-venues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMsg = errorData.error || "Failed to fetch pending venues"
      const details = errorData.details ? ` - ${errorData.details}` : ""
      console.error(`API Error (${response.status}):`, errorMsg, details)
      throw new Error(errorMsg + details)
    }

    const data = await response.json()
    return data.venues || []
  } catch (error) {
    console.error("Error fetching pending venues via API:", error)
    throw error
  }
}
