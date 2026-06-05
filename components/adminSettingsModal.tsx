"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Shield, AlertCircle } from "lucide-react"
import { useAdminView } from "@/lib/admin-context"
import { useAuth } from "@/lib/auth-context"

interface AdminSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const { isAdminView, toggleAdminView } = useAdminView()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Verify admin access when modal opens
  useEffect(() => {
    if (isOpen && user) {
      verifyAdminAccess()
    }
  }, [isOpen, user?.uid])

  const verifyAdminAccess = async () => {
    if (!user) {
      setVerificationError("Not authenticated")
      return
    }

    setIsVerifying(true)
    setVerificationError(null)

    try {
      // Get ID token from Firebase
      const auth = (await import("@/lib/firebase")).getAuthWithPersistence()
      const authInstance = await auth
      const currentUser = authInstance.currentUser

      if (!currentUser) {
        setVerificationError("Authentication required")
        return
      }

      const idToken = await currentUser.getIdToken(true) // Force refresh

      // Verify with backend
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        setVerificationError(data.error || "Verification failed")
        console.warn(`Admin verification failed: ${data.error}`)
        return
      }

      const data = await response.json()
      if (!data.isAdmin) {
        setVerificationError("Admin access denied")
        console.warn(`Unauthorized admin access attempt from UID: ${user.uid}`)
        return
      }
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationError("Failed to verify admin status")
    } finally {
      setIsVerifying(false)
    }
  }

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              className="relative bg-card rounded-3xl shadow-2xl border border-border/30 flex flex-col"
              style={{ width: "420px", height: "420px" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="relative z-10 flex items-center justify-between p-5 border-b border-border/20 bg-card/95 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-foreground">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center p-6">
                {verificationError ? (
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Access Denied</h4>
                      <p className="text-xs text-muted-foreground mt-2">{verificationError}</p>
                    </div>
                  </div>
                ) : isVerifying ? (
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Verifying admin access...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    <Shield className="w-8 h-8 text-red-600" />
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Admin Mode</h4>
                      <p className="text-xs text-muted-foreground mt-1">Switch to admin view</p>
                    </div>
                    <motion.button
                      onClick={toggleAdminView}
                      className="relative px-8 py-2.5 rounded-full font-semibold transition-all flex-shrink-0 cursor-pointer mt-4"
                      animate={{
                        backgroundColor: isAdminView ? "#dc2626" : "rgba(0, 0, 0, 0.06)",
                        color: isAdminView ? "#ffffff" : "#000000",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isAdminView ? "Admin" : "User"}
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-5 border-t border-border/20 bg-card/95 backdrop-blur-sm">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-2.5 rounded-2xl border-2 border-border/50 text-foreground font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null
}
