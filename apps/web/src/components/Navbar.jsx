'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import NavbarAuth from './NavbarAuth'

export default function SiteNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const mainLinks = ['Home', 'About Us', 'Sermons', 'Blog', 'Give']
  const ministries = ['Worship', , 'Franchise Kids']
  const resources = [
    'Membership classes',
    'Counselling',
  ]
  const connect = ['Visit Franchise']
  const media = ['Watch online']

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-black text-white py-4 px-6 flex justify-between items-center relative z-50">
        {/* Logo */}
        <Link href="/" className="cursor-pointer">
  <img
    src="/assets/logo.png"
    alt="Franchise Church Logo"
    className="h-10 w-auto object-contain"
  />
</Link>


        <div className="flex items-center gap-3">
          <NavbarAuth />
          {/* Hamburger Icon */}
          <button
            onClick={() => setIsOpen(true)}
            className="text-2xl text-white cursor-pointer"
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
        </div>
      </nav>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black text-white z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-start p-6">
              {/* Logo */}
<img
  src="/assets/logo.png"
  alt="Franchise Church Logo"
  className="h-10 w-auto object-contain"
/>

              {/* Close Icon */}
              <button onClick={() => setIsOpen(false)} className="text-3xl cursor-pointer">
                <FiX />
              </button>
            </div>

            <div className="flex flex-col md:flex-row p-6 gap-12 max-w-7xl mx-auto">
              {/* Left: Stacked Nav Links */}
              <div className="flex-1">
                {mainLinks.map((link) => {
  const path = link.toLowerCase().replace(/\s+/g, '-')
  const href = path === 'home' ? '/' : path === 'blog' ? '/blog' : `/pages/${path}`
  return (
    <Link
      key={link}
      href={href}
      className={`block text-4xl font-extrabold uppercase mb-4 cursor-pointer${
        link === 'Give' ? 'text-gold' : 'text-white'
      }`}
      onClick={() => setIsOpen(false)}
    >
      {link}
    </Link>
  )
})}
              </div>

              {/* Right: Columns */}
              <div className="flex flex-1 flex-col md:flex-row gap-12">
                <div>
                  <h4 className="text-sm uppercase text-gray-400 mb-2">Ministries</h4>
                  {ministries.map((item) => (
                    <p key={item} className="text-sm mb-1">
                      {item}
                    </p>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm uppercase text-gray-400 mb-2">Resources</h4>
                  {resources.map((item) => (
                    <p key={item} className="text-sm mb-1">
                      {item}
                    </p>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm uppercase text-gray-400 mb-2">Connect</h4>
                  {connect.map((item) => (
                    <p key={item} className="text-sm mb-1">
                      {item}
                    </p>
                  ))}
                  <h4 className="text-sm uppercase text-gray-400 mt-4 mb-2">Media</h4>
                  {media.map((item) => (
                    // <p key={item} className="text-sm mb-1">
                    //   {item}
                    // </p>
                    <Link 
                              href="https://www.youtube.com/@thefranchisechurch" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="text-white font-normal text-sm cursor-pointer"
                              >
                                {item}
                              </motion.button>
                            </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Social Icons (optional) */}
            <div className="mt-10 text-center text-sm text-gray-500 pb-6">
              &copy; {new Date().getFullYear()} Franchise Church. All rights reserved.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
