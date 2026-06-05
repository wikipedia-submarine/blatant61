import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { getDb } from "./firestore"

export interface FirestoreEventItem {
  id: string
  action: string
  message: string
  timestamp: string
}

export async function logEvent(action: string, message: string): Promise<void> {
  const db = getDb()
  const eventsCollection = collection(db, "events")

  try {
    await addDoc(eventsCollection, {
      action,
      message,
      timestamp: serverTimestamp(),
    })
  } catch (err) {
    console.error("[ActivityLog] Failed to log event", err)
  }
}

export async function getLatestEvents(): Promise<FirestoreEventItem[]> {
  const db = getDb()
  const eventsCollection = collection(db, "events")
  
  let querySnapshot;
  try {
    console.log("[ActivityLog] Fetching latest events (sorted)...")
    const q = query(eventsCollection, orderBy("timestamp", "desc"), limit(20))
    querySnapshot = await getDocs(q)
  } catch (err) {
    console.warn("[ActivityLog] Sorted query failed. Error:", err)
    console.log("[ActivityLog] Retrying with unsorted fallback...")
    try {
      const qFallback = query(eventsCollection, limit(10))
      querySnapshot = await getDocs(qFallback)
    } catch (fallbackErr) {
      console.error("[ActivityLog] Unsorted fallback also failed:", fallbackErr)
      throw fallbackErr // Re-throw if both fail
    }
  }

  console.log(`[ActivityLog] Found ${querySnapshot.docs.length} events.`)
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    let ts = ""
    if (data.timestamp && typeof data.timestamp === "object" && "toDate" in data.timestamp) {
      ts = (data.timestamp as any).toDate().toISOString()
    } else if (data.timestamp && typeof data.timestamp === "object" && "seconds" in data.timestamp) {
      ts = new Date((data.timestamp as any).seconds * 1000).toISOString()
    } else if (typeof data.timestamp === "string") {
      ts = data.timestamp
    } else {
      ts = new Date().toISOString()
    }

    return {
      id: doc.id,
      action: data.action || "Unknown Action",
      message: data.message || "",
      timestamp: ts,
    }
  })
}
export async function deleteAllEvents(): Promise<void> {
  const db = getDb()
  const eventsCollection = collection(db, "events")
  const snapshot = await getDocs(eventsCollection)
  
  const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, "events", document.id)))
  await Promise.all(deletePromises)
}
