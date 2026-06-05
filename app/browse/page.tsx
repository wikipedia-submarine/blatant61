import { Suspense } from "react"
import BrowseClient from "./BrowseClient"
import { Header } from "@/components/header"

const venuesData = [
  {
    id: 1,
    nameKey: "skylinePenthouse" as const,
    locationKey: "vakeTbilisi" as const,
    price: 450,
    guests: 30,
    image: "/images/venues/skyline-penthouse.jpg",
    images: [
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/mountain-retreat.jpg",
      "/images/venues/rooftop-terrace.jpg",
      "/images/venues/garden-villa.jpg",
      "/images/venues/seaside-villa.jpg",
    ],
    description: "Luxury penthouse with city views",
    amenities: ["wifi", "kitchen", "heating"],
    location: "Vake, Tbilisi",
    premium: true,
    category: "rooftops" as const,
  },
  {
    id: 2,
    nameKey: "gardenVilla" as const,
    locationKey: "saburtaloTbilisi" as const,
    price: 680,
    guests: 50,
    image: "/images/venues/garden-villa.jpg",
    images: [
      "/images/venues/garden-villa.jpg",
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/seaside-villa.jpg",
      "/images/venues/rooftop-terrace.jpg",
      "/images/venues/loft-studio.jpg",
    ],
    description: "Beautiful garden villa with spacious grounds",
    amenities: ["wifi", "kitchen"],
    location: "Saburtalo, Tbilisi",
    premium: true,
    category: "villas" as const,
  },
  {
    id: 3,
    nameKey: "rooftopTerrace" as const,
    locationKey: "oldTownTbilisi" as const,
    price: 320,
    guests: 25,
    image: "/images/venues/rooftop-terrace.jpg",
    images: [
      "/images/venues/rooftop-terrace.jpg",
      "/images/venues/seaside-villa.jpg",
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/garden-villa.jpg",
      "/images/venues/mountain-retreat.jpg",
    ],
    description: "Charming rooftop terrace in historic old town",
    amenities: ["wifi", "heating"],
    location: "Old Town, Tbilisi",
    premium: false,
    category: "rooftops" as const,
  },
  {
    id: 4,
    nameKey: "loftStudio" as const,
    locationKey: "veraTbilisi" as const,
    price: 280,
    guests: 20,
    image: "/images/venues/loft-studio.jpg",
    images: [
      "/images/venues/loft-studio.jpg",
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/garden-villa.jpg",
      "/images/venues/seaside-villa.jpg",
      "/images/venues/rooftop-terrace.jpg",
    ],
    description: "Modern loft studio with contemporary design",
    amenities: ["wifi", "kitchen", "heating"],
    location: "Vera, Tbilisi",
    premium: false,
    category: "studios" as const,
  },
  {
    id: 5,
    nameKey: "seasideVilla" as const,
    locationKey: "batumi" as const,
    price: 890,
    guests: 60,
    image: "/images/venues/seaside-villa.jpg",
    images: [
      "/images/venues/seaside-villa.jpg",
      "/images/venues/mountain-retreat.jpg",
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/garden-villa.jpg",
      "/images/venues/rooftop-terrace.jpg",
    ],
    description: "Luxurious seaside villa with beach access",
    amenities: ["wifi", "kitchen"],
    location: "Batumi",
    premium: true,
    category: "villas" as const,
  },
  {
    id: 6,
    nameKey: "mountainRetreat" as const,
    locationKey: "borjomi" as const,
    price: 520,
    guests: 35,
    image: "/images/venues/mountain-retreat.jpg",
    images: [
      "/images/venues/mountain-retreat.jpg",
      "/images/venues/seaside-villa.jpg",
      "/images/venues/skyline-penthouse.jpg",
      "/images/venues/garden-villa.jpg",
      "/images/venues/loft-studio.jpg",
    ],
    description: "Peaceful mountain retreat surrounded by nature",
    amenities: ["wifi", "heating"],
    location: "Borjomi",
    premium: false,
    category: "apartments" as const,
  },
]

export default function BrowsePage() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] relative">
      <Header />
      <Suspense fallback={<div className="pt-24 px-6">Loading venues...</div>}>
        <BrowseClient venuesData={venuesData} />
      </Suspense>
    </main>
  )
}
