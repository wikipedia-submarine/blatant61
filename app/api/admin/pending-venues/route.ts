import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps } from "firebase-admin/app"
import { cert } from "firebase-admin/app"

// Initialize Firebase Admin SDK
let adminApp: any = null

function getAdminApp() {
  if (getApps().length === 0) {
    // Get credentials from environment
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin credentials in environment variables")
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  return getApps()[0] || adminApp
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const idToken = authHeader.substring(7)

    // Verify the token and get user info
    let adminAuth, decodedToken, userEmail
    try {
      adminAuth = getAuth(getAdminApp())
      decodedToken = await adminAuth.verifyIdToken(idToken)
      userEmail = decodedToken.email
    } catch (authError) {
      console.error("Auth verification error:", authError)
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const ADMIN_EMAILS = ["sandrogogitidze316@gmail.com"]
    if (!ADMIN_EMAILS.includes(userEmail || "")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Get pending venues from Firestore
    let db, venuesSnapshot
    try {
      db = getFirestore(getAdminApp())
      venuesSnapshot = await db
        .collection("venues")
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get()
    } catch (firestoreError) {
      const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
      console.error("Firestore query error:", errorMsg)

      // Check if it's an index error
      if (errorMsg.includes("index")) {
        return NextResponse.json(
          {
            error: "Database index is still being created. This typically takes 2-5 minutes. Please try again in a moment.",
            details: errorMsg
          },
          { status: 503 }
        )
      }

      throw firestoreError
    }

    const venues = venuesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ venues })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("Error fetching pending venues:", errorMsg)

    // Check for specific error types
    if (errorMsg.includes("Missing Firebase Admin credentials")) {
      return NextResponse.json(
        {
          error: "Server configuration error: Firebase Admin credentials not set up. Contact administrator.",
          details: errorMsg
        },
        { status: 500 }
      )
    }

    if (errorMsg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: "Failed to fetch pending venues",
        details: process.env.NODE_ENV === "development" ? errorMsg : undefined
      },
      { status: 500 }
    )
  }
}
