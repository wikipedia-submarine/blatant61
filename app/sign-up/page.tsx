"use client"
 
 import { useState } from "react"
 import Link from "next/link"
 import { useRouter } from "next/navigation"
 import { useAuth } from "@/lib/auth-context"
 import { LanguageSwitcher } from "@/components/languageSwitcher"
 import { motion } from "framer-motion"
 
 export default function SignUpPage() {
   const router = useRouter()
   const [name, setName] = useState("")
   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")
   const [confirmPassword, setConfirmPassword] = useState("")
   const [error, setError] = useState("")
   const [loading, setLoading] = useState(false)
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
       setTimeout(() => {
         router.push("/")
       }, 300)
     } catch (err: any) {
       setError(err.message || "Failed to create account")
       setLoading(false)
     }
   }
 
   return (
     <main className="min-h-screen bg-[#F7F7F4] dark:bg-[#0a0a0b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background subtle glow */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-full pointer-events-none opacity-40">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
       </div>
 
       <div className="w-full max-w-[460px] relative z-10">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
           className="bg-white dark:bg-white/5 border border-[#1a1a1c]/5 dark:border-white/10 rounded-2xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
         >
           <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#1a1a1c]/5 dark:border-white/5">
             <Link href="/">
               <h1 className="text-xl font-black tracking-tighter text-[#1a1a1c] dark:text-white uppercase">FESTIVO</h1>
             </Link>
             <LanguageSwitcher variant="light" />
           </div>
 
           <div className="mb-8 text-center">
             <h2 className="text-2xl font-bold text-[#1a1a1c] dark:text-white tracking-tight mb-1">Create account</h2>
             <p className="text-sm text-[#1a1a1c]/40 dark:text-white/40 font-medium">Join the elite community</p>
           </div>
 
           <form onSubmit={handleSignUp} className="space-y-4">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#1a1a1c]/40 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Full Name</label>
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="John Doe"
                 className="w-full px-5 py-3.5 rounded-xl border border-[#1a1a1c]/10 bg-white dark:bg-white/5 text-[#1a1a1c] dark:text-white placeholder:text-[#1a1a1c]/20 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent/40 transition-all duration-300 font-medium text-sm"
                 required
               />
             </div>
 
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-[#1a1a1c]/40 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Email Address</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="your@email.com"
                 className="w-full px-5 py-3.5 rounded-xl border border-[#1a1a1c]/10 bg-white dark:bg-white/5 text-[#1a1a1c] dark:text-white placeholder:text-[#1a1a1c]/20 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent/40 transition-all duration-300 font-medium text-sm"
                 required
               />
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-[#1a1a1c]/40 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Password</label>
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full px-5 py-3.5 rounded-xl border border-[#1a1a1c]/10 bg-white dark:bg-white/5 text-[#1a1a1c] dark:text-white placeholder:text-[#1a1a1c]/20 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent/40 transition-all duration-300 font-medium text-sm"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-[#1a1a1c]/40 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Confirm</label>
                 <input
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full px-5 py-3.5 rounded-xl border border-[#1a1a1c]/10 bg-white dark:bg-white/5 text-[#1a1a1c] dark:text-white placeholder:text-[#1a1a1c]/20 focus:outline-none focus:ring-4 focus:ring-accent/5 focus:border-accent/40 transition-all duration-300 font-medium text-sm"
                   required
                 />
               </div>
             </div>
 
             {error && (
               <div className="p-3 rounded-lg bg-red-500/5 text-red-500 text-xs font-bold text-center">
                 {error}
               </div>
             )}
 
             <button
               type="submit"
               disabled={loading}
               className="w-full py-4 px-6 rounded-xl bg-[#1a1a1c] dark:bg-white text-white dark:text-[#1a1a1c] font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-black/5"
             >
               {loading ? "Creating..." : "Create Account"}
             </button>
           </form>
 
           <div className="mt-8 pt-8 border-t border-[#1a1a1c]/5 dark:border-white/5 text-center">
             <p className="text-[#1a1a1c]/40 dark:text-white/40 font-bold text-xs">
               Already have an account?{" "}
               <Link href="/sign-in" className="text-accent hover:underline ml-1">Sign In</Link>
             </p>
           </div>
         </motion.div>
       </div>
     </main>
   )
 }
