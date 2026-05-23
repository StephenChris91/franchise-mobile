'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/assets/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/100 z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
        >
          A generation,<br />
          Awakened to eternity<br />
          <span className="text-gold">Rejoicing forever in Christ.</span>
        </motion.h1>

        <Link
          href="https://www.youtube.com/@thefranchisechurch"
          target="_blank"
          rel="noopener noreferrer"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 px-6 py-2 rounded-sm border border-white bg-[#af601a] text-white font-normal text-sm hover:bg-white hover:text-black transition-all cursor-pointer"
          >
            Watch Live
          </motion.button>
        </Link>
      </div>
    </div>
  )
}
