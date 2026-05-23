// components/about/AboutApproachSection.js
import React from 'react'
import { FaBook, FaHeart, FaBullhorn } from 'react-icons/fa'

export default function AboutApproachSection() {
  return (
    <section className="bg-white py-24 px-6 pb-10">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-normal mb-2 text-black">Our Approach</h2>
        <p className="text-sm md:text-base text-gray-600">Faith. Hope. Love. <br />We believe in an intentional walk with God.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {/* Know it */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gold text-[#af601a] p-6 rounded-full text-3xl shadow-lg">
            <FaBook />
          </div>
          <h3 className="text-xl font-bold text-black uppercase">Know it</h3>
          <p className="text-sm text-gray-700 max-w-xs">
            We believe that truly knowing Christ comes through sound doctrine, firmly rooted in the unchanging Word of God.
          </p>
        </div>

        {/* Live it */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gold text-[#af601a] p-6 rounded-full text-3xl shadow-lg">
            <FaHeart />
          </div>
          <h3 className="text-xl font-bold text-black uppercase">Live it</h3>
          <p className="text-sm text-gray-700 max-w-xs">
We believe true spiritual maturity is revealed in the way you live, with Christ clearly seen in you.
          </p>
        </div>

        {/* Tell it */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gold text-[#af601a] p-6 rounded-full text-3xl shadow-lg">
            <FaBullhorn />
          </div>
          <h3 className="text-xl font-bold text-black uppercase">Tell it</h3>
          <p className="text-sm text-gray-700 max-w-xs">
We believe the gospel is the calling of every believer, for each one is entrusted as a minister of Christ.
          </p>
        </div>
      </div>
    </section>
  )
}
