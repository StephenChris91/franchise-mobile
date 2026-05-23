'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function IntroSection() {
  return (
    <section className="w-full px-4 py-16 md:px-16 bg-white text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        <div className="space-y-6">
          <h2 className="lg:text-7xl text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            We Serve God <span className="text-[#af601a]"> <br />By His Spirit</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            At Franchise Church, our mission is to help you grow in the knowledge and experience of God. We believe in the transforming power of the gospel and the leading of the Spirit in everyday life.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            We are more than just a congregation—we are a family, deeply rooted in love, purpose, and impact. Join us as we celebrate Jesus and live out His truth boldly in every sphere of influence.
          </p>
        </div>

        <div className="w-full h-auto flex justify-center">
          <Image
            src="/assets/intro-pastor.jpg"
            alt="Lead Pastor"
            width={480}
            height={580}
            className="rounded-xl object-cover shadow-lg"
          />
        </div>
      </motion.div>
    </section>
  )
}
