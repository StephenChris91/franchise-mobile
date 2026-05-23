'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LeadPastorSection() {
  return (
    <section className="bg-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-12">
        {/* Pastor Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <img
            src="/assets/pastor.jpg"
            alt="Lead Pastor"
            className="rounded-xl w-full h-auto object-cover"
          />
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold text-gold uppercase mb-2">Our Lead Pastor</p>
          <h3 className="text-3xl md:text-4xl font-bebas mb-4 tracking-wide">
            Pastor Tosin Martins
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Pastor Tosin leads Franchise Church with a passionate commitment to teaching
            the Word and discipling believers. He is a shepherd, a visionary, and a servant leader
            driven by the Spirit to raise people who live for Christ and influence their world.
          </p>
          <Link href="/pages/about-us">
            <button className="mt-4 px-6 py-2 rounded-sm border border-white bg-[#af601a] text-white font-normal text-sm hover:bg-white hover:text-black transition-all cursor-pointer">
              Learn More
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
