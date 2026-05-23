'use client'

import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'

export default function WelcomeSection() {
  return (
    <section className="py-16 bg-[#ededed] text-center">
      <div className="flex justify-center">
        <span className="text-xs uppercase tracking-wide font-semibold bg-yellow-400 px-4 py-1 rounded-full flex items-center gap-2 text-gray-100">
          <span role="img" aria-label="emoji">🚀</span>
          Welcome to Franchise
        </span>
      </div>

      <h2 className="text-4xl md:text-5xl font-bebas tracking-widest text-black mt-4">Welcome Home!</h2>

      <p className="text-gray-600 max-w-md mx-auto mt-2 text-sm">
        Dive into our teachings, events and community. <br />
        Your journey of faith begins here.
      </p>

      {/* Carousel Buttons */}
      <div className="flex justify-center mt-6 gap-4">
        <button className=" bg-gray-50  h-12 w-12 rounded-full border border-[#af601a] text-lg text-black hover:text-gold hover:border-gold transition">
          <FaArrowLeft className="mx-auto" />
        </button>
        <button className="bg-gray-50 h-12 w-12 rounded-full border border-[#af601a] text-lg text-black hover:text-gold hover:border-gold transition">
          <FaArrowRight className="mx-auto" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 px-4 max-w-6xl mx-auto">
        <Card
          image="/assets/about.jpg"
          badge="WHO WE ARE"
          title="About us"
        />
        <Card
          image="/assets/connect.jpg"
          badge="JOIN OUR COMMUNITY"
          title="Connect with us"
        />
        <Card
          image="/assets/celebration.jpg"
          badge="ENDLESS CELEBRATION"
          title="Celebrations"
        />
      </div>
    </section>
  )
}

function Card({ image, badge, title }) {
  return (
    <div className="relative group overflow-hidden rounded-xl h-96 shadow-lg">
      <img src={image} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
      <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6 text-left text-white">
        <p className="text-xs uppercase tracking-wider text-gray-300 mb-1">{badge}</p>
        <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
      </div>
    </div>
  )
}
