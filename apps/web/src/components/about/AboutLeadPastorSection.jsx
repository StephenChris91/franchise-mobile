// components/about/AboutLeadPastorSection.js
import React from 'react'
import Image from 'next/image'

export default function AboutLeadPastorSection() {
  return (
    <section className="w-full bg-white py-24 px-6 pb-44">
      <div className="max-w-7xl mx-auto bg-black rounded-md overflow-hidden flex flex-col md:flex-row">
        {/* Left Image */}
        <div className="md:w-1/2 w-full">
          <Image
            src="/assets/lead-pastor.jpg"
            alt="Pastor Tosin Martins"
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Content */}
        <div className="md:w-1/2 w-full p-8 md:p-12 text-white flex flex-col justify-center space-y-6">
          {/* Logo */}
          <Image src="/assets/logo.png" alt="Franchise Global Logo" width={100} height={50} />

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">Our Lead Pastor</h2>

          {/* Paragraphs */}
          <p className="text-sm leading-relaxed">
            Tosin Martins serves as the founder and Lead Pastor of Franchise Church, a Kingdom-focused ministry with an expanding global footprint from its base in Nigeria. Carrying a unique blend of preaching, teaching, and music, his ministry inspires transformation and calls believers into the fullness of their God-ordained destiny. His heartbeat is to see lives reshaped by the Gospel until purpose becomes a lived reality.
          </p>

          <p className="text-sm leading-relaxed">
            His pastoral journey was birthed in the community of This Present House, Lagos, under the guidance of Pastor Tony Rapu. From those early days of discipleship and service, a vision took root, one that has since flourished into Franchise Church, a mission-driven, teaching-centered ministry dedicated to raising believers who live their faith with conviction and impact in every sphere of influence.
          </p>
        </div>
      </div>
    </section>
  )
}
