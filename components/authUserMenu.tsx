"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, LayoutGrid, User, Heart, Inbox, Building2 } from "lucide-react"
import Link from "next/link"
import { getUserVenues } from "@/lib/firestore-venues"

interface AuthUserMenuProps {
  variant?: "mobile" | "desktop"
}

export function AuthUserMenu({ variant = "desktop" }: AuthUserMenuProps) {
  const { user, userProfile, logout, isAdmin } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hasRequests, setHasRequests] = useState(false)

  useEffect(() => {
    if (user) {
      getUserVenues(user.uid).then(venues => {
        setHasRequests(venues.length > 0)
      })
    }
  }, [user])

  if (!user) return null

  const displayName = userProfile?.displayName || user.email?.split("@")[0] || "User"
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }
  return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full focus:outline-none outline-none group transition-all duration-300 hover:scale-110 cursor-pointer hover:cursor-pointer">
            <Avatar className="h-12 w-12 cursor-pointer hover:shadow-lg transition-all duration-300">
              <AvatarImage src={userProfile?.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="bg-[#4a5f7f] text-white font-bold text-base hover:bg-[#4a5f7f]/90 transition-colors duration-300">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-64 mt-4">
          <DropdownMenuLabel className="flex flex-col gap-2 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userProfile?.photoURL || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#4a5f7f] text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-bold text-foreground truncate">{displayName}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
              <User className="w-4 h-4" />
              <span className="text-sm">My Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/saved" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
              <Heart className="w-4 h-4" />
              <span className="text-sm">Saved Venues</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/requests" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
              <Inbox className="w-4 h-4" />
              <span className="text-sm">Booking Requests</span>
            </Link>
          </DropdownMenuItem>
          {hasRequests && (
            <DropdownMenuItem asChild>
              <Link href="/profile/venue-upload-requests" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Venue Upload Requests</span>
              </Link>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-semibold">Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/booking-requests" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
                  <Inbox className="w-4 h-4" />
                  <span className="text-sm font-semibold">All Booking Requests</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/events" className="flex items-center gap-3 cursor-pointer py-2" onClick={() => setIsDropdownOpen(false)}>
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-semibold">Manage Events</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center gap-3 cursor-pointer py-2 font-medium group"
          >
            <LogOut className="w-4 h-4 transition-colors" />
            <span className="text-sm">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
