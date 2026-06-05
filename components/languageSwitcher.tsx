"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"

interface LanguageSwitcherProps {
  variant?: "light" | "dark" | "navbar"
  isOverDarkSection?: boolean
}

export function LanguageSwitcher({ isOverDarkSection = false, variant }: LanguageSwitcherProps) {
  const { language, setLanguage, isTransitioning } = useLanguage()
  const isEffectiveDark = isOverDarkSection || variant === "dark"
  
  const languages = [
    { code: "en", label: "EN" },
    { code: "ka", label: "GEO" },
  ]

  return (
    <div className="flex items-center justify-center px-1">
      <div 
        className="relative flex items-center p-[3px] rounded-[12px] transition-all duration-700"
        style={{
          background: isEffectiveDark 
            ? "rgba(255, 255, 255, 0.15)" 
            : "rgba(0, 0, 0, 0.12)",
          boxShadow: isEffectiveDark 
            ? "0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(0, 0, 0, 0.2)" 
            : "0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* The Refined Grey-Styled Pill */}
        <motion.div
          className="absolute top-[3px] bottom-[3px] rounded-[9px] z-0"
          initial={false}
          animate={{
            left: language === "en" ? 3 : "calc(50% + 1px)",
            width: "calc(50% - 4px)",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
            mass: 0.8
          }}
          style={{
            background: isEffectiveDark 
              ? "rgba(255, 255, 255, 0.25)" 
              : "rgba(0, 0, 0, 0.12)",
            boxShadow: isEffectiveDark 
              ? "inset 0 1px 0 rgba(255, 255, 255, 0.05)" 
              : "0 1px 4px rgba(0, 0, 0, 0.06)",
          }}
        />

        {languages.map((lang) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              disabled={isTransitioning}
              onClick={() => setLanguage(lang.code as any)}
              className={`
                relative z-10 w-[58px] h-[30px] flex items-center justify-center text-[10px] font-black tracking-[0.2em] transition-all duration-500 outline-none
                ${isActive 
                  ? (isEffectiveDark ? "text-white" : "text-black") 
                  : (isEffectiveDark ? "text-white/20 hover:text-white/50" : "text-black/60 hover:text-black")}
              `}
            >
              <motion.span
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  opacity: isActive ? 1 : 0.6
                }}
                transition={{ duration: 0.4 }}
              >
                {lang.label}
              </motion.span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

