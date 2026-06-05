"use client"

import { ReactNode, useEffect } from "react"
import { useLoadingContext } from "@/lib/loading-context"
import { AuthProvider } from "@/lib/auth-context"
import { AdminProvider } from "@/lib/admin-context"
import { LanguageProvider } from "@/lib/language-context"
import { SmoothScroll } from "@/components/smoothScroll"
import { GlobalNotifications } from "@/components/globalNotifications"

export function LayoutClient({ children }: { children: ReactNode }) {
  const { isInitialLoading } = useLoadingContext()

  useEffect(() => {
    if (isInitialLoading) {
      document.body.classList.add("is-initial-loading")
    } else {
      document.body.classList.remove("is-initial-loading")
    }
  }, [isInitialLoading])

  return (
    <AuthProvider>
      <AdminProvider>
        <LanguageProvider>
          <SmoothScroll>
            <GlobalNotifications />
            {children}
          </SmoothScroll>
        </LanguageProvider>
      </AdminProvider>
    </AuthProvider>
  )
}
