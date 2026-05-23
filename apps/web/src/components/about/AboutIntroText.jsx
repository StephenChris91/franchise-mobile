// components/about/AboutIntroText.js
import React from 'react'

export default function AboutIntroText() {
  return (
    <div className="text-center md:text-left space-y-4 max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold uppercase text-gold">
        We Serve God <br className="hidden md:block" />
        <span className="text-white">By His Spirit</span>
      </h2>

      <p className="text-white text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">
        At Franchise Church, we believe that the Christian life is powered by the Holy Spirit. From
        our expressions in worship to our depth in prayer and power in doctrine, we lean on the
        person and power of the Spirit for daily victory and lasting transformation.
      </p>

      <p className="text-white text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">
        Our commitment to God’s Spirit is reflected in our services, in our cell systems, in our
        outreach strategy and in how we train leaders. This is not church as usual — this is life
        in the Spirit.
      </p>
    </div>
  )
}
