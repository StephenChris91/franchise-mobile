// components/about/AboutBelieveSection.js
import React from 'react'

export default function AboutBelieveSection() {
  return (
    <section
      className="relative bg-cover bg-center py-24 px-4 mb-24"
      
    >
      <div className="max-w-6xl mx-auto flex justify-end px-4 md:px-8 p-24 rounded-md"
      style={{
        backgroundImage: "url('/assets/pastor-tosin.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      >
        <div className="bg-white bg-opacity-95 rounded-md p-8 md:p-10 max-w-xl shadow-xl">
          <h2 className="text-3xl md:text-4xl font-normal mb-4">
            <span className="text-black">We </span>
            <span className="text-gold">Believe</span>
          </h2>

          <ul className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed list-disc pl-5">
            <li>
              We believe the gifts of the Spirit are alive in every believer, and our gatherings are marked by the free and unhindered flow of the Spirit through prayer, prophecy, and songs birthed in worship.
            </li>
            <li>
              We hold the Word of God as our final and absolute authority in all doctrine.
            </li>
            <li>
              We affirm that the Father’s greatest expression of love is revealed in the redemptive work of Christ.
            </li>
            <li>
              We are blessed beyond measure, clothed in His righteousness, made ours through the overflowing grace of our Lord Jesus Christ.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
