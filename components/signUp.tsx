"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft, Mail, Lock, User } from "lucide-react"

interface SignUpProps {
  onClose?: () => void
  onSignIn?: () => void
}

export function SignUp({ onClose, onSignIn }: SignUpProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signUp } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, name)
      // Modal will close automatically via onClose callback
      setTimeout(() => {
        if (onClose) onClose()
      }, 300)
    } catch (err: any) {
      setError(err.message || "Failed to create account")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground">Create Account</h1>
          <p className="text-center text-muted-foreground">Join FESTIVO today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-3">
            <label htmlFor="name" className="block text-foreground font-semibold">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40 transition-[box-shadow,border-color,background-color] duration-300"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="email" className="block text-foreground font-semibold">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40 transition-[box-shadow,border-color,background-color] duration-300"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="block text-foreground font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40 transition-[box-shadow,border-color,background-color] duration-300"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="confirmPassword" className="block text-foreground font-semibold">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40 transition-[box-shadow,border-color,background-color] duration-300"
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-apple-red/10 border border-apple-red/30 flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-apple-red/20 flex-shrink-0 mt-0.5">
                <span className="w-4 h-4 text-apple-red">!</span>
              </div>
              <p className="text-sm font-medium text-apple-red">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-accent to-blue-600 text-white font-bold cursor-pointer hover:shadow-lg hover:scale-105 transition-[transform,box-shadow,opacity] duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3 px-6 rounded-xl border-2 border-accent/30 hover:border-accent/60 bg-accent/5 hover:bg-accent/10 text-foreground font-semibold cursor-pointer transition-[background-color,border-color] duration-300"
          >
            Sign In
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl border-2 border-border text-foreground font-semibold cursor-pointer hover:bg-foreground hover:text-background hover:border-foreground transition-[background-color,color,border-color] duration-300 flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Back to Home
          </button>
        )}
      </div>
    </div>
  )
}
