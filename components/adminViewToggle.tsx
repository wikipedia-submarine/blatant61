"use client"

import { useAdminView } from "@/lib/admin-context"
import { motion } from "framer-motion"

export function AdminViewToggle() {
  const { isAdminView, toggleAdminView } = useAdminView()

  return (
    <motion.button
      onClick={toggleAdminView}
      className="relative px-3 py-2 rounded-full font-semibold text-sm transition-all duration-300"
      style={{
        backgroundColor: isAdminView ? "#dc2626" : "rgba(0, 0, 0, 0.06)",
        color: isAdminView ? "#ffffff" : "#000000",
        boxShadow: isAdminView ? "0 4px 12px rgba(220, 38, 38, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isAdminView ? "Switch to User View" : "Switch to Admin View"}
    >
      {isAdminView ? "Admin" : "User"}
    </motion.button>
  )
}
