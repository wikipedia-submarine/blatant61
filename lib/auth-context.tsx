"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth"
import { getAuthWithPersistence } from "./firebase"

interface User {
  uid: string
  email: string | null
  displayName: string | null
}

interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  isAdmin: boolean
  photoURL: string | null
  bio?: string
  createdAt?: string
  savedVenueIds?: string[]
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  logout: () => Promise<void>
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

import { ADMIN_UIDS, ADMIN_EMAILS, isUserAdmin } from "./admins"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Firestore helpers are loaded dynamically to avoid bundling Firebase on the
// initial paint. This keeps the first JS chunk small.
const loadFirestoreHelpers = async () => {
  const [{ doc, getDoc, setDoc, updateDoc }, { getDb }] = await Promise.all([
    import("firebase/firestore"),
    import("./firestore"),
  ])
  return { doc, getDoc, setDoc, updateDoc, getDb }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        const authInstance = await getAuthWithPersistence();

        const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
          if (!mounted) return;

          if (firebaseUser) {
            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            }
            setUser(userData)

            const isAdminUser = isUserAdmin(firebaseUser.uid, firebaseUser.email);

            const createdAt = firebaseUser.metadata?.creationTime
              ? new Date(firebaseUser.metadata.creationTime).toISOString()
              : new Date().toISOString();

            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isAdmin: isAdminUser,
              photoURL: firebaseUser.photoURL,
              createdAt: createdAt,
            }
            setUserProfile(defaultProfile)
            setIsAdmin(isAdminUser)
            setLoading(false)
          } else {
            setUser(null)
            setUserProfile(null)
            setIsAdmin(false)
            setLoading(false)
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up auth:", error);
        setLoading(false);
      }
    };

    const cleanup = setupAuth();
    return () => {
      mounted = false;
      cleanup?.then(fn => fn?.());
    };
  }, [])

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchUserProfile = async () => {
      try {
        const { doc, getDoc, setDoc, getDb } = await loadFirestoreHelpers()
        const db = getDb()
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!mounted) return;

        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          const isAdminUser = isUserAdmin(user.uid, user.email) || profileData.isAdmin || false;

          const profileWithCreatedAt = {
            ...profileData,
            createdAt: profileData.createdAt || userProfile?.createdAt,
          };

          setUserProfile(profileWithCreatedAt);
          setIsAdmin(isAdminUser);
        } else {
          try {
            const isAdminUser = isUserAdmin(user.uid, user.email);
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              isAdmin: isAdminUser,
              photoURL: userProfile?.photoURL || null,
              createdAt: userProfile?.createdAt || new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            if (mounted) {
              setUserProfile(newProfile);
              setIsAdmin(isAdminUser);
            }
          } catch (writeError) {
            console.warn("Could not create user profile in Firestore:", writeError);
          }
        }
      } catch (firestoreError) {
        console.warn("Could not fetch user profile from Firestore:", firestoreError);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUserProfile();
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.uid])

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    try {
      if (!email || !password || !name) {
        throw new Error("All fields are required")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      const authInstance = await getAuthWithPersistence();

      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
      const firebaseUser = userCredential.user

      await updateProfile(firebaseUser, {
        displayName: name,
      })

      const isAdminUser = isUserAdmin(firebaseUser.uid, firebaseUser.email);

      const createdAt = firebaseUser.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime).toISOString()
        : new Date().toISOString();

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        isAdmin: isAdminUser,
        photoURL: null,
        createdAt,
      }

      try {
        const { doc, setDoc, getDb } = await loadFirestoreHelpers()
        const db = getDb()
        await setDoc(doc(db, "users", firebaseUser.uid), newProfile)
      } catch (firestoreError) {
        console.warn("Could not save user profile to Firestore, but signup completed:", firestoreError)
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
      })
      setUserProfile(newProfile)
      setIsAdmin(isAdminUser)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create account"

      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already in use")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address")
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak")
      }

      throw new Error(errorMessage)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      const authInstance = await getAuthWithPersistence();

      const userCredential = await signInWithEmailAndPassword(authInstance, email, password)
      const firebaseUser = userCredential.user

      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      }
      setUser(userData)

      const isAdminUser = isUserAdmin(firebaseUser.uid, firebaseUser.email);

      const createdAt = firebaseUser.metadata?.creationTime
        ? new Date(firebaseUser.metadata.creationTime).toISOString()
        : new Date().toISOString();

      const defaultProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isAdmin: isAdminUser,
        photoURL: firebaseUser.photoURL,
        createdAt: createdAt,
      }
      setUserProfile(defaultProfile)
      setIsAdmin(isAdminUser)

    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in"

      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email")
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address")
      } else if (error.code === "auth/user-disabled") {
        throw new Error("This account has been disabled")
      }

      throw new Error(errorMessage)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      const authInstance = await getAuthWithPersistence();
      await signOut(authInstance)
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
    } catch (error) {
      console.error("Error logging out:", error)
      throw new Error("Failed to log out")
    }
  }, [])

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      const authInstance = await getAuthWithPersistence();
      const firebaseUser = authInstance.currentUser
      if (!firebaseUser) throw new Error("No user logged in")

      if (updates.displayName || updates.photoURL) {
        await updateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName || undefined,
          photoURL: updates.photoURL || firebaseUser.photoURL || undefined,
        })
      }

      try {
        const { doc, updateDoc, getDb } = await loadFirestoreHelpers()
        const db = getDb()
        const userDocRef = doc(db, "users", firebaseUser.uid)
        const currentProfile = userProfile || {}
        const updatedProfile = { ...currentProfile, ...updates }
        await updateDoc(userDocRef, updates)

        setUserProfile(updatedProfile as UserProfile)
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: updates.displayName || firebaseUser.displayName,
        })
      } catch (firestoreError) {
        console.warn("Could not update profile in Firestore:", firestoreError)
        setUserProfile({
          ...userProfile,
          ...updates,
        } as UserProfile)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }, [userProfile])

  const contextValue = React.useMemo(() => ({
    user,
    userProfile,
    loading,
    logout,
    isAdmin,
    signIn,
    signUp,
    updateProfile: updateUserProfile,
  }), [user, userProfile, loading, logout, isAdmin, signIn, signUp, updateUserProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
