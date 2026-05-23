'use client'

import { BsTwitter, BsInstagram } from 'react-icons/bs'
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer
      className="bg-black text-white px-4 py-10 border-t border-gray-800"
      id="footer"
    >
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo + Description */}
        <div>
          <h2 className="text-2xl font-bold text-[#af601a] mb-3">
            The Franchise Church
          </h2>
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} The Franchise Church. All rights reserved.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-white font-semibold mb-1">Explore</p>
          <Link href="/" className="text-white/70 hover:text-[#af601a] transition-colors">
            Home
          </Link>
          <Link href="/pages/about-us" className="text-white/70 hover:text-[#af601a] transition-colors">
            About Us
          </Link>
          <Link href="/pages/sermons" className="text-white/70 hover:text-[#af601a] transition-colors">
            Sermons
          </Link>
          <Link href="/blog" className="text-white/70 hover:text-[#af601a] transition-colors">
            Blog
          </Link>
          <Link href="/pages/give" className="text-white/70 hover:text-[#af601a] transition-colors">
            Give
          </Link>
        </div>

        {/* Contact & Socials */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-white font-semibold mb-1">Contact</p>
          <p className="text-white/70">info@thefranchiselagos.com.ng</p>
          <p className="text-white/70">Lagos, Nigeria</p>
          <div className="flex gap-4 mt-3 text-xl">
            <a
              href="https://x.com/franchisechurch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#af601a] transition-colors"
              aria-label="Twitter / X"
            >
              <BsTwitter />
            </a>
            <a
              href="https://www.instagram.com/thefranchisechurch/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#af601a] transition-colors"
              aria-label="Instagram"
            >
              <BsInstagram />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
