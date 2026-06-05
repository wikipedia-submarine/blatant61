import {
  getFirestore as getClientFirestore,
  type Firestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore"

import { getFirebaseApp } from "./firebase"

let dbInstance: Firestore | null = null

export const getDb = (): Firestore => {
  if (!dbInstance) {
    const app = getFirebaseApp()
    dbInstance = getClientFirestore(app)
  }

  return dbInstance
}

export { doc, setDoc, getDoc }
