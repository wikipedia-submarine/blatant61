import type React from "react"
import type { Metadata, Viewport } from "next"
import { LoadingProvider } from "@/lib/loading-context"
import { LayoutClient } from "@/components/layout-client"
import "./globals.css"

export const metadata: Metadata = {
  title: "Event Venues | Find & Book Spaces",
  description:
    "Discover and book unique apartments, rooftops, villas, and event spaces across Georgia.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <LoadingProvider>
          <LayoutClient>
            {children}
          </LayoutClient>
        </LoadingProvider>
      </body>
    </html>
  )
}
