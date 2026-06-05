import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQ } from "@/components/faq"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background relative">
      <Header />
      
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/90 text-background hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold hover:bg-foreground backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </div>

      <div className="pt-24">
        <FAQ />
      </div>

      <Footer />
    </main>
  )
}
