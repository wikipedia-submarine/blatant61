"use client"

import Link from "next/link"
import { ListYourSpace } from "./listYourSpace"

export function Footer() {
  return (
    <footer className="bg-black text-white pt-0 pb-12 relative z-10 w-full mt-8 md:mt-12">
      {/* Internal Card - Using the existing ListYourSpace component */}
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 z-20 mb-16 md:mb-20">
        <ListYourSpace className="shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]" />
      </div>

      <div className="max-w-[1040px] mx-auto px-6 lg:px-8 mt-8 md:mt-12">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
          {/* Column 1: Logo & Contact */}
          <div className="flex flex-col gap-8 md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight text-white">
              {/* Custom icon matching skipmatrix */}
              <div className="w-5 h-5 grid grid-cols-2 gap-[2px] opacity-90">
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white rounded-[1px]"></div>
                <div className="bg-white rounded-[1px]"></div>
              </div>
              FESTIVO
            </div>
            
            <div className="text-[#888888] text-[14px] leading-[1.6]">
              20619 Torrence Chapel Rd<br/>
              Suite 116 #1040<br/>
              Cornelius, NC 28031<br/>
              United States
            </div>

            <div className="grid grid-cols-2 gap-6 mt-2">
              <div>
                <div className="text-[#666666] text-[12px] mb-1.5 font-medium">Phone number</div>
                <div className="text-[#e0e0e0] text-[14px] font-medium tracking-wide">1-800-201-1019</div>
              </div>
              <div>
                <div className="text-[#666666] text-[12px] mb-1.5 font-medium">Email</div>
                <div className="text-[#e0e0e0] text-[14px] font-medium">support@festivo.com</div>
              </div>
            </div>
          </div>

          {/* Spacer for MD screens */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Columns */}
          <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-4 md:pl-8">
            <div className="flex flex-col gap-6">
              <h4 className="text-[#666666] text-[13px] font-medium">Quick links</h4>
              <nav className="flex flex-col gap-4 text-[14px] font-medium">
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Pricing</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Resources</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">About us</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">FAQ</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Contact us</Link>
              </nav>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-[#666666] text-[13px] font-medium">Social</h4>
              <nav className="flex flex-col gap-4 text-[14px] font-medium">
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Facebook</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Instagram</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">LinkedIn</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Twitter</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Youtube</Link>
              </nav>
            </div>

            <div className="flex flex-col gap-6 col-span-2 sm:col-span-1 mt-4 sm:mt-0">
              <h4 className="text-[#666666] text-[13px] font-medium">Legal</h4>
              <nav className="flex flex-col gap-4 text-[14px] font-medium">
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Terms of service</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Privacy policy</Link>
                <Link href="#" className="text-[#aaaaaa] hover:text-white transition-colors">Cookie policy</Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-white/[0.08] text-[#666666] text-[13px] font-medium">
          © 2026 FESTIVO. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
