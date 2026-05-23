// components/about/AboutServeGodSection.js
import React from 'react'

export default function AboutServeGodSection() {
  return (
    <section className="bg-white py-24 px-4 w-full pb-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-start justify-between">
        {/* Left Heading */}
        <div className="w-full md:w-1/4">
          <h2 className="lg:text-5xl text-3xl md:text-4xl font-normal text-black leading-tight">
            We Serve God
            <br />
            <span className="text-[#af601a]">By His Spirit</span>
          </h2>
        </div>

        {/* Right Text Columns */}
        <div className="w-full md:w-3/4 grid md:grid-cols-3 gap-6 text-sm text-gray-800 leading-relaxed">
          <p className='text-justify'>
            Franchise Church is a Christ-centered, mission-driven teaching ministry birthed in 2018 under the leadership of Pastor Tosin Martins. Our vision is clear; to see every life rejoice in the endless life of Christ Jesus and walk fully in the power of His death, burial, and resurrection.
          </p>
          <p className='text-justify'>
            We are devoted to knowing Christ intimately and making Him known to the nations. Through deep teaching, fervent prayer, and impactful outreach, we equip believers to live courageously for the Kingdom. Our gatherings are alive with the gifts of the Spirit, where prayers rise, prophecies are declared, and songs of the Spirit fill the atmosphere with worship.
          </p>
          <p className='text-justify'>
            We hold the Word of God as our unshakable foundation, the final authority for all doctrine. We believe the greatest display of God’s love is revealed in the redeeming work of Christ and through His grace, we stand blessed, righteous, and victorious.
          </p>
        </div>
      </div>
    </section>
  )
}
