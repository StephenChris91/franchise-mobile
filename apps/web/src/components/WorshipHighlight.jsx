'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
export default function WorshipHighlight() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <img
        src="/assets/worship.jpg"
        alt="Worship at Franchise Church"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Black Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/30 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4 text-white">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bebas tracking-wide mb-4"
        >
          We boast in <br /> Christ Jesus
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-sm md:text-base text-gray-300"
        >
At Franchise Church, our glory is not found in titles or achievements, but in the completed work of Christ. His victory is our proclamation, and His truth is the heartbeat of our worship.        </motion.p>
    <Link href="/pages/about-us">
      <motion.button
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
        className="mt-4 px-6 py-2 rounded-sm border border-white bg-[#af601a] text-white font-normal text-sm hover:bg-white hover:text-black transition-all cursor-pointer"
      >
        Learn More
      </motion.button>
    </Link>
        
      </div>
    </section>
  )
}
