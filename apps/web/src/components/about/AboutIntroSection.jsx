// components/about/AboutIntroSection.js
import React from 'react'
import Image from 'next/image'
import AboutIntroText from './AboutIntroText'

export default function AboutIntroSection() {
  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        <AboutIntroText />
        <div className="mt-10 md:mt-0 md:ml-10">
          <Image
            src="/assets/about/spirit.png"
            alt="Franchise Church"
            width={450}
            height={600}
            className="rounded-lg shadow-lg object-cover"
          />
        </div>
      </div>
    </section>
  )
}
