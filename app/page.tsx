import { Header } from "@/components/header"
import { HeroSection } from "@/components/heroSection"
import { ExploreByCategory } from "@/components/exploreByCategory"
import { FeaturedVenuesGrid } from "@/components/featuredVenuesGrid"
import { PopularLocations } from "@/components/popularLocations"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#EEF3F8] relative homepage-wrapper overflow-x-hidden">
      <Header />
      <HeroSection />
      <ExploreByCategory />
      <FeaturedVenuesGrid />
      <PopularLocations />
      <Footer />
    </main>
  )
}
