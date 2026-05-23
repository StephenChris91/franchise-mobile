'use client'

export default function GiveBanner() {
  return (
    <section className="relative bg-[#af601a] pt-32 pb-20 px-4 lg:mt-44">
      {/* Floating GIVE CARD */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-full max-w-6xl bg-[#ededed] text-black rounded-xl shadow-lg p-10 md:p-14 overflow-hidden h-96">
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-normal leading-tight text-black mb-4 font-bebas tracking-wide">
            Give to <span className="text-gold">Franchise Church</span>
          </h2>
          <p className="text-gray-700 text-sm mb-6">
            Your generosity keeps blessing lives, thank you for giving.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="bg-black text-white px-6 py-2 rounded-sm font-normal text-sm hover:bg-[#af601a] hover:text-white transition cursor-pointer">
              Give Now
            </button>
            <button className="bg-[#af601a] text-white px-6 py-2 rounded-sm font-normal text-sm hover:bg-gray-900 cursor-pointer">
              Building Project
            </button>
          </div>
        </div>

        {/* Hand Art Image (bottom right) */}
       <img
  src="/assets/hand.webp"
  alt="Hand Art"
  className="absolute right-0 bottom-0 h-[300px] md:h-[400px] opacity-10 pointer-events-none select-none"
/>

      </div>

      {/* Mailing List */}
      <div className="pt-40 text-center text-white max-w-2xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold tracking-widest uppercase mb-4">
          Join our mailing list
        </h3>
        <p className="text-sm mb-6">
          We promise not to spam you, but send you edifying and amazing content regularly from Franchise Church.
        </p>

        <form className="flex justify-center items-center gap-2 flex-wrap">
          <input
            type="email"
            placeholder="Email address"
            required
            className="px-5 py-3 rounded-sm w-72 text-black outline-none border border-gray-300 focus:border-[#000000] transition"
          />
          <button
            type="submit"
            className="bg-white text-black px-6 py-3 rounded-sm font-semibold hover:bg-gray-200"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  )
}
