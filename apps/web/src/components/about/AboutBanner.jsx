'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function AboutBanner() {
  return (
    <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
      {/* Visible Background Image */}
      <div
className="absolute inset-0 bg-cover bg-no-repeat z-0"
        style={{ backgroundImage: "url('/assets/banner.png')" }}
      />

      {/* Bottom-to-top dark fade */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Centered Content */}
      <div className="relative z-20 text-center text-white px-4">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-block bg-white/10 text-xs uppercase font-heading tracking-wide px-4 py-1 rounded-full mb-4"
        >
          HERE, ON EARTH
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:text-6xl text-4xl md:text-6xl font-extrabold leading-tight"
        >
          AS IN HEAVEN!  <br />
          {/* <span className="text-[#af601a]">SO ALSO ON EARTH!</span> */}
        </motion.h1>
      </div>
    </section>
  )
}
