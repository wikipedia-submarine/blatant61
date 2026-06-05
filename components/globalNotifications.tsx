"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, Bell } from "lucide-react"
import { getUserVenues } from "@/lib/firestore-venues"
import { useAuth } from "@/lib/auth-context"

const AUTO_DISMISS_MS = 8000
const APPROVAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "info"
}

export function GlobalNotifications() {
  const { user } = useAuth()
  const hasChecked = useRef(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})
  
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id])
      delete timeoutsRef.current[id]
    }
  }, [])

  const addNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => [...prev, notification])
      const timer = setTimeout(() => removeNotification(notification.id), AUTO_DISMISS_MS)
      timeoutsRef.current[notification.id] = timer
    },
    [removeNotification],
  )

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(timeoutsRef.current).forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      hasChecked.current = false
      return
    }

    if (hasChecked.current) return
    hasChecked.current = true

    const checkNewApprovals = async () => {
      try {
        const venues = await getUserVenues(user.uid)
        const approved = venues.filter((v) => v.status === "approved")

        const seenIdsKey = `seen_approvals_${user.uid}`
        let seenIds: string[] = []
        try {
          const parsed = JSON.parse(localStorage.getItem(seenIdsKey) ?? "[]")
          seenIds = Array.isArray(parsed) ? parsed : []
        } catch {
          seenIds = []
        }

        const now = Date.now()
        const newApprovals = approved.filter((v) => {
          if (!v.id || seenIds.includes(v.id)) return false
          if (!v.reviewedAt) return false
          const reviewedDate =
            v.reviewedAt instanceof Date
              ? v.reviewedAt
              : (v.reviewedAt as any).toDate()
          return now - reviewedDate.getTime() < APPROVAL_WINDOW_MS
        })

        if (newApprovals.length > 0) {
          newApprovals.forEach((v) => {
            addNotification({
              id: `approval_${v.id}`,
              title: "Venue Approved!",
              message: `Your space "${v.spaceName}" has been approved and is now live.`,
              type: "success",
            })
          })

          const updatedSeenIds = Array.from(
            new Set([...seenIds, ...newApprovals.map((v) => v.id!)]),
          )
          localStorage.setItem(seenIdsKey, JSON.stringify(updatedSeenIds))
        }
      } catch (error) {
        console.error("Error checking notifications:", error)
      }
    }

    checkNewApprovals()
  }, [user, addNotification])

  return (
    <div className="fixed bottom-8 right-8 z-[300] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-80 p-5 rounded-[28px] bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border/10 flex gap-4 items-start relative overflow-hidden"
          >
            <div
              className={`p-3 rounded-2xl ${
                n.type === "success"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {n.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 space-y-1 pr-6">
              <h4 className="text-sm font-black uppercase tracking-tight">{n.title}</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {n.message}
              </p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-foreground/5 text-muted-foreground transition-all cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
              className={`absolute bottom-0 left-0 right-0 h-1 origin-left ${
                n.type === "success" ? "bg-green-500" : "bg-blue-500"
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
