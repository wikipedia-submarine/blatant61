"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface LoadingContextType {
  isLoading: boolean
  isInitialLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

// Threshold in milliseconds before showing loading animation
// Set to 300ms - if page loads faster than this, loading screen won't show
const LOADING_DELAY_THRESHOLD = 300

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const router = useRouter()
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startLoading = useCallback(() => {
    // Clear any existing timeout first
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Set a timeout to show loading only if it takes longer than threshold
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      loadingTimeoutRef.current = null
    }, LOADING_DELAY_THRESHOLD)
  }, [])

  const stopLoading = useCallback(() => {
    // Clear the timeout if page loads before threshold
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    setIsLoading(false)
  }, [])

  // Listen for route changes
  useEffect(() => {
    // Setup manual route interception
    const originalPush = router.push
    const originalReplace = router.replace

    // Override router methods to show loading with delay
    ;(router as any).push = function (href: string, options?: any) {
      startLoading()
      // Ensure loading stops after navigation completes
      setTimeout(() => {
        originalPush.call(this, href, options)
      }, 0)
    }

    ;(router as any).replace = function (href: string, options?: any) {
      startLoading()
      setTimeout(() => {
        originalReplace.call(this, href, options)
      }, 0)
    }

    return () => {
      // Restore original methods on cleanup
      ;(router as any).push = originalPush
      ;(router as any).replace = originalReplace

      // Clear timeout on cleanup
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [router, startLoading, stopLoading])

  // Initial load delay removed per user request for immediate rendering.
  useEffect(() => {
    setIsInitialLoading(false)
  }, [])

  // Stop loading when component mounts (page loaded)
  useEffect(() => {
    stopLoading()
  }, [stopLoading])

  return (
    <LoadingContext.Provider value={{ isLoading, isInitialLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingContext() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoadingContext must be used within a LoadingProvider")
  }
  return context
}
