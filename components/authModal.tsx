"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { SignIn } from "./sign-in"
import { SignUp } from "./sign-up"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "signin" | "signup"
}

export function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up overflow-y-auto">
      <div className="w-full max-w-md bg-background rounded-[28px] shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-[background-color,color] duration-300 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mt-4">
          {mode === "signin" ? (
            <SignIn
              onClose={onClose}
              onSignUp={() => setMode("signup")}
            />
          ) : (
            <SignUp
              onClose={onClose}
              onSignIn={() => setMode("signin")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
