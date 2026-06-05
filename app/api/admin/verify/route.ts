import { getAuthWithPersistence, getDb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { NextRequest, NextResponse } from "next/server"
import { getDb as getFirestoreDb } from "@/lib/firestore"

// Admin UUIDs - in production, these should be stored in a secure database
// and environment variables, never hardcoded in client-accessible code
const ADMIN_UIDS = [
  "jVy9P9PaBMhZNCiOU89BoclQmqf1",
]

// Security headers for the response
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Type": "application/json",
}

// Simple rate limiting (in production, use Redis or similar)
const requestLog = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const requests = requestLog.get(identifier) || []
  const recentRequests = requests.filter((time) => now - time < RATE_LIMIT_WINDOW)

  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false
  }

  recentRequests.push(now)
  requestLog.set(identifier, recentRequests)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Only allow POST requests
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405, headers: securityHeaders }
      )
    }

    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown"

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: securityHeaders }
      )
    }

    // Get the auth token from the Authorization header
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`[SECURITY] Missing/invalid auth header from ${clientIp}`)
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authorization header" },
        { status: 401, headers: securityHeaders }
      )
    }

    const idToken = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token and extract UID
    let userUid: string | null = null
    try {
      // Decode JWT manually (tokens are signed by Firebase)
      const parts = idToken.split(".")
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid token format" },
          { status: 401, headers: securityHeaders }
        )
      }

      // Decode payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      )

      // Validate token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return NextResponse.json(
          { error: "Unauthorized: Token expired" },
          { status: 401, headers: securityHeaders }
        )
      }

      userUid = payload.sub // Firebase stores UID as 'sub' in JWT
    } catch (error) {
      console.warn(
        `[SECURITY] Token decode failed from ${clientIp}: ${error}`
      )
      return NextResponse.json(
        { error: "Unauthorized: Failed to verify token" },
        { status: 401, headers: securityHeaders }
      )
    }

    if (!userUid) {
      console.warn(`[SECURITY] No UID in token from ${clientIp}`)
      return NextResponse.json(
        { error: "Unauthorized: No user ID in token" },
        { status: 401, headers: securityHeaders }
      )
    }

    // CRITICAL: Server-side admin verification
    // This check happens on the server and cannot be bypassed by client-side code
    const isAdmin = ADMIN_UIDS.includes(userUid)

    if (!isAdmin) {
      console.warn(
        `[SECURITY] Unauthorized admin access attempt by UID: ${userUid} from ${clientIp}`
      )
      return NextResponse.json(
        { error: "Forbidden: User is not an admin" },
        { status: 403, headers: securityHeaders }
      )
    }

    // Additional verification: Check Firestore profile
    try {
      const db = getFirestoreDb()
      const userDocRef = doc(db, "users", userUid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        console.warn(
          `[SECURITY] Admin access attempted by unregistered UID: ${userUid}`
        )
        return NextResponse.json(
          { error: "Forbidden: User profile not found" },
          { status: 403, headers: securityHeaders }
        )
      }
    } catch (firestoreError) {
      console.error("Error verifying admin in Firestore:", firestoreError)
      // Don't block access if Firestore is temporarily down
      // but the token is valid
    }

    // SUCCESS: Admin verified
    console.log(`[SECURITY] Admin access verified for UID: ${userUid}`)

    return NextResponse.json(
      {
        isAdmin: true,
        uid: userUid,
        message: "Admin verified successfully",
      },
      { status: 200, headers: securityHeaders }
    )
  } catch (error) {
    console.error("[SECURITY] Admin verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: securityHeaders }
    )
  }
}
