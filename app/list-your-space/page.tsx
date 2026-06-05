"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { ProtectedRoute } from "@/components/protectedRoute"
import { useAuth } from "@/lib/auth-context"
import { submitVenue, getUserVenues } from "@/lib/firestore-venues"
import { uploadImages } from "@/lib/cloud-storage"
import {
  InputField, TextareaField, PillSelect, PhotoUpload, AvailabilityCalendar,
  AMENITIES, CATEGORIES, CITIES, STEP_INFO,
  type VenueFormValues, INITIAL_FORM
} from "@/components/listSpaceForm"

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = step === 0 ? 0 : (step / total) * 100
  return (
    <div className="h-1 w-full bg-[#E7E7E2] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#111111] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

function LeftPanel() {
  return (
    <div className="hidden lg:block w-full h-full relative overflow-hidden bg-[#F7F7F4]">
      {/* The image now fills the left panel and sticks to the top/bottom/left */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/listyourspaceleft.png')" }}
      />
    </div>
  )
}

function Content() {
  const { t } = useLanguage()
  const { user, userProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<VenueFormValues>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [venueCount, setVenueCount] = useState<number>(0)
  const [limitLoading, setLimitLoading] = useState(true)
  const totalSteps = 6

  useEffect(() => {
    async function checkLimit() {
      if (user) {
        try {
          const venues = await getUserVenues(user.uid)
          setVenueCount(venues.filter(v => v.status === "pending").length)
        } catch (error) { console.error("Error checking venue limit:", error) }
        finally { setLimitLoading(false) }
      } else { setLimitLoading(false) }
    }
    checkLimit()
  }, [user])

  const updateForm = <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const canGoNext = () => {
    if (currentStep === 1) return formData.spaceName.trim().length > 0
    if (currentStep === 2) return formData.location.trim().length > 0
    if (currentStep === 3) return formData.images.length > 0
    if (currentStep === 4) return Number(formData.price) > 0 && Number(formData.maxGuests) > 0
    if (currentStep === 5) return formData.availableDates.length > 0
    if (currentStep === 6) return formData.contactPhone.trim().length > 0 && formData.contactEmail.includes("@")
    return true
  }

  const handleNext = () => {
    if (canGoNext()) { setCurrentStep(prev => prev + 1); setErrorMessage(null) }
    else setErrorMessage("Please fill in required fields")
  }
  const handleBack = () => { setCurrentStep(prev => Math.max(0, prev - 1)); setErrorMessage(null) }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData(prev => ({ ...prev, images: [...prev.images, result] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!user || !userProfile) return setErrorMessage("Please sign in first.")
    setIsSubmitting(true); setSubmitStatus("uploading")
    try {
      const venueId = `v_${Date.now()}`
      const imageUrls = await uploadImages(formData.images, venueId)
      const submissionData = { ...formData }
      await submitVenue(submissionData, user.uid, userProfile.email || "", userProfile.displayName || "", imageUrls, [])
      setSubmitStatus("success")
    } catch { setErrorMessage("Failed to publish."); setSubmitStatus("error") }
    finally { setIsSubmitting(false) }
  }

  // Loading
  if (limitLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F4] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#E7E7E2] border-t-[#111111] animate-spin" />
      </div>
    )
  }

  // Limit reached
  if (venueCount >= 3) {
    return (
      <main className="min-h-screen bg-[#F7F7F4] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-[440px] w-full bg-white rounded-[24px] p-10 text-center shadow-sm border border-[#E7E7E2]">
          <div className="w-14 h-14 rounded-full bg-[#F7F7F4] flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-tight mb-3">Limit Reached</h2>
          <p className="text-[14px] text-[#6B7280] mb-8 leading-relaxed">You have 3 active pending requests. Manage your existing listings before adding new ones.</p>
          <div className="flex flex-col gap-3">
            <Link href="/profile/venue-upload-requests" className="py-3.5 px-8 rounded-xl bg-[#111111] text-white font-medium text-[14px] hover:bg-black transition-colors text-center">
              Manage Requests
            </Link>
            <Link href="/" className="py-3.5 px-8 rounded-xl text-[#111111] font-medium text-[14px] border border-[#E7E7E2] hover:bg-[#F7F7F4] transition-colors text-center">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    )
  }

  // Step content renderer
  const renderStep = () => {
    const anim = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }

    switch (currentStep) {
      case 0: return (
        <motion.div key="intro" {...anim} className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="max-w-[480px] w-full">
            <h1 className="text-[2.5rem] md:text-[3.2rem] font-semibold text-[#111111] tracking-tight leading-[1.1] mb-4">
              List your space<br />in <span className="italic font-serif font-light">minutes</span>
            </h1>
            <p className="text-[16px] text-[#6B7280] leading-relaxed mb-10 max-w-[380px] mx-auto">
              Join Georgia's most exclusive community of event spaces and start reaching thousands of guests.
            </p>
            <button onClick={() => setCurrentStep(1)}
              className="w-full max-w-[320px] py-4 px-8 rounded-xl bg-[#111111] text-[#FFFFFF] font-medium text-[16px] hover:bg-black active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mx-auto">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/" className="block mt-6 text-[14px] text-[#6B7280] hover:text-[#111111] transition-colors font-medium">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      )
      case 1: return (
        <motion.div key="s1" {...anim} className="space-y-6">
          <StepHeader title="The Basics" sub="Name your space and pick a category" />
          <InputField label="Space Name" placeholder="e.g. Skyline Penthouse" required value={formData.spaceName} onChange={e => updateForm("spaceName", e.target.value)} />
          <div className="space-y-3">
            <label className="text-[13px] font-medium text-[#111111]">Category</label>
            <PillSelect items={CATEGORIES} selected={formData.category} onSelect={id => updateForm("category", id)} />
          </div>
          <TextareaField label="Description" placeholder="Tell us about your space, what makes it special..." rows={4} value={formData.description} onChange={e => updateForm("description", e.target.value)} />
        </motion.div>
      )
      case 2: return (
        <motion.div key="s2" {...anim} className="space-y-6">
          <StepHeader title="Location" sub="Help guests find your venue" />
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-[13px] font-medium text-[#111111]">City</label>
              <PillSelect items={CITIES} selected={formData.city} onSelect={id => updateForm("city", id)} />
            </div>
            <InputField label="District / Neighborhood" placeholder="e.g. Vake" value={formData.district} onChange={e => updateForm("district", e.target.value)} />
            <InputField label="Address" placeholder="Full address" required value={formData.location} onChange={e => updateForm("location", e.target.value)} />
            <InputField label="Google Maps Link" placeholder="https://maps.google.com/..." value={formData.mapsLink} onChange={e => updateForm("mapsLink", e.target.value)} />
          </div>
        </motion.div>
      )
      case 3: return (
        <motion.div key="s3" {...anim} className="space-y-6">
          <StepHeader title="Visuals" sub="Great photos are the #1 factor in bookings" />
          <PhotoUpload images={formData.images} onAdd={handleImageUpload} onRemove={i => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} />
        </motion.div>
      )
      case 4: return (
        <motion.div key="s4" {...anim} className="space-y-6">
          <StepHeader title="Details" sub="Set your pricing and highlight amenities" />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Hourly Price (₾)" type="number" placeholder="e.g. 150" required value={formData.price} onChange={e => updateForm("price", e.target.value)} />
            <InputField label="Daily Price (₾) (Optional)" type="number" placeholder="e.g. 1200" value={formData.dailyPrice} onChange={e => updateForm("dailyPrice", e.target.value)} />
            <InputField label="Max Guests" type="number" placeholder="e.g. 30" required value={formData.maxGuests} onChange={e => updateForm("maxGuests", e.target.value)} />
            <InputField label="Min Duration (hrs)" type="number" placeholder="e.g. 2" required value={formData.minDuration} onChange={e => updateForm("minDuration", e.target.value)} />
          </div>
          <div className="space-y-3">
            <label className="text-[13px] font-medium text-[#111111]">Amenities</label>
            <PillSelect items={AMENITIES} selected={formData.amenities} onSelect={id => updateForm("amenities", formData.amenities.includes(id) ? formData.amenities.filter(x => x !== id) : [...formData.amenities, id])} multi />
          </div>
        </motion.div>
      )
      case 5: return (
        <motion.div key="s5" {...anim} className="space-y-6">
          <StepHeader title="Availability" sub="Select the dates your space is available" />
          <AvailabilityCalendar selectedDates={formData.availableDates} onChange={dates => updateForm("availableDates", dates)} />
          {formData.availableDates.length > 0 && (
            <p className="text-[14px] text-[#6B7280] font-medium">{formData.availableDates.length} date{formData.availableDates.length > 1 ? "s" : ""} selected</p>
          )}
        </motion.div>
      )
      case 6: return (
        <motion.div key="s6" {...anim} className="space-y-6">
          <StepHeader title="Almost Done" sub="Add your contact info and submit" />
          <InputField label="Phone Number" placeholder="+995 ..." required value={formData.contactPhone} onChange={e => updateForm("contactPhone", e.target.value)} />
          <InputField label="Email" type="email" placeholder="you@example.com" required value={formData.contactEmail} onChange={e => updateForm("contactEmail", e.target.value)} />
          <div className="p-6 rounded-[16px] bg-[#F7F7F4] border border-[#E7E7E2]">
            <h4 className="text-[14px] font-semibold text-[#111111] mb-4">Review Summary</h4>
            <div className="space-y-3 text-[14px] text-[#6B7280]">
              <div className="flex justify-between"><span>Space</span><span className="font-medium text-[#111111]">{formData.spaceName || "—"}</span></div>
              <div className="flex justify-between"><span>Category</span><span className="font-medium text-[#111111] capitalize">{formData.category}</span></div>
              <div className="flex justify-between"><span>Location</span><span className="font-medium text-[#111111] capitalize">{formData.city}{formData.district ? `, ${formData.district}` : ""}</span></div>
              <div className="flex justify-between"><span>Rate</span><span className="font-medium text-[#111111]">{formData.price ? `₾${formData.price}/hr` : "—"}</span></div>
              <div className="flex justify-between"><span>Photos</span><span className="font-medium text-[#111111]">{formData.images.length}</span></div>
              <div className="flex justify-between"><span>Dates</span><span className="font-medium text-[#111111]">{formData.availableDates.length}</span></div>
            </div>
          </div>
        </motion.div>
      )
      default: return null
    }
  }

  // Success
  if (submitStatus === "success") {
    return (
      <main className="min-h-screen bg-[#F7F7F4] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-[440px] w-full bg-white rounded-[24px] p-10 text-center shadow-sm border border-[#E7E7E2]">
          <div className="w-16 h-16 rounded-full bg-[#F7F7F4] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#111111]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-tight mb-3">Request Sent!</h2>
          <p className="text-[14px] text-[#6B7280] mb-8 leading-relaxed max-w-[300px] mx-auto">
            Our team will review your listing and notify you once it's approved.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/profile/venue-upload-requests" className="py-3.5 px-8 rounded-xl bg-[#111111] text-white font-medium text-[14px] hover:bg-black transition-colors text-center">
              View My Requests
            </Link>
            <Link href="/" className="py-3.5 px-8 rounded-xl text-[#111111] font-medium text-[14px] border border-[#E7E7E2] hover:bg-[#F7F7F4] transition-colors text-center">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] flex">
      {/* Left Panel - Fixed full height, top left */}
      <div className="hidden lg:block w-[40%] xl:w-[45%] h-screen sticky top-0 left-0 bg-[#F7F7F4] flex-shrink-0">
        <LeftPanel />
      </div>

      {/* Right Panel - Scrollable content */}
      <div className="flex-1 min-h-screen flex flex-col justify-center py-8 px-6 lg:px-12 xl:px-24">
        
        <div className="max-w-[560px] w-full mx-auto">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="text-[#111111] text-lg font-semibold tracking-tight">FESTIVO</Link>
            {currentStep > 0 && (
              <span className="text-[13px] font-medium text-[#6B7280]">Step {currentStep} of {totalSteps}</span>
            )}
          </div>

          {/* Progress */}
          {currentStep > 0 && <div className="mb-10"><ProgressBar step={currentStep} total={totalSteps} /></div>}

          {/* Form Content */}
          <div className={`${currentStep === 0 ? "flex items-center justify-center min-h-[60vh]" : ""}`}>
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {currentStep > 0 && (
            <div className="mt-10 flex items-center gap-4">
              <button onClick={handleBack}
                className="py-4 px-6 rounded-xl text-[#111111] font-medium text-[15px] border border-[#E7E7E2] hover:bg-[#F7F7F4] transition-all cursor-pointer flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={currentStep === totalSteps ? handleSubmit : handleNext} disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-xl bg-[#111111] text-[#FFFFFF] font-medium text-[15px] hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                {isSubmitting ? "Submitting..." : currentStep === totalSteps ? "Submit for Review" : "Continue"}
                {!isSubmitting && currentStep < totalSteps && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-6 text-center text-[14px] font-medium text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{errorMessage}</motion.p>
          )}
        </div>
      </div>
    </main>
  )
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[1.75rem] font-semibold text-[#111111] tracking-tight leading-tight">{title}</h2>
      <p className="text-[15px] text-[#6B7280] mt-2">{sub}</p>
    </div>
  )
}

export default function ListYourSpacePage() {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  )
}
