"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface AdminContextType {
  isAdminView: boolean
  toggleAdminView: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminView, setIsAdminView] = useState(false)

  const toggleAdminView = () => {
    setIsAdminView(!isAdminView)
  }

  return (
    <AdminContext.Provider value={{ isAdminView, toggleAdminView }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminView() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdminView must be used within an AdminProvider")
  }
  return context
}
