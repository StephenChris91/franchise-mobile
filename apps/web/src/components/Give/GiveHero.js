"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const GiveHero = () => {
  return (
    <section className="relative h-[85vh] md:h-screen w-full overflow-hidden">
      {/* Background image */}
      <Image
        src="/assets/give-hero-bg.jpg"
        alt="Worship"
        layout="fill"
        objectFit="cover"
        className="absolute top-0 left-0 w-full h-full z-0"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full w-full flex flex-col justify-center items-center text-center text-white px-4 max-w-3xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="uppercase text-sm tracking-widest font-medium mb-2"
        >
          Give
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
        >
          <span className="text-white">Your Generosity. </span>
          <span className="text-[#af601a]">Our Mission.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 text-base md:text-lg text-white/90"
        >
          Partner with us to spread the life-transforming message of the gospel
          to the nations.
        </motion.p>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 flex flex-col sm:flex-row items-center gap-4"
        >
          <button className="bg-white text-black font-semibold px-6 py-3 rounded-md shadow cursor-pointer transition hover:bg-gray-200">
            Give Now
          </button>
          <button className="bg-transparent border border-white px-6 py-3 rounded-md font-semibold text-white hover:bg-white hover:text-black transition cursor-pointer">
            Other Ways to Give
          </button>
        </motion.div> */}
      </div>
    </section>
  );
};

export default GiveHero;
