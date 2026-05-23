'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import Hls from 'hls.js'

export default function MovementSection() {
  const [openModal, setOpenModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!openModal) return

    setLoading(true)
    fetch('/api/mux/latest')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setVideoUrl(data.url)
        } else {
          console.error('Mux API error:', data)
        }
      })
      .finally(() => setLoading(false))
  }, [openModal])

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current.play()
        })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoUrl
        videoRef.current.play()
      }
    }
  }, [videoUrl])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setOpenModal(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      <section className="bg-black text-white text-center py-24 px-4">
        <div className="mb-4">
          <span className="inline-block bg-white/10 text-xs font-semibold px-4 py-1 rounded-full tracking-widest">
            🔵 Global Reach
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl mb-4 leading-snug">
          Igniting a Global Awakening <br />
          From City Streets to Nations&apos; Hearts
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="mt-4 px-6 py-2 rounded-sm border border-white bg-[#af601a] text-white font-normal text-sm hover:bg-white hover:text-black transition-all cursor-pointer"
        >
          Listen to Our Declaration
        </button>
      </section>

      {/* Custom Dialog — no flowbite dependency */}
      <AnimatePresence>
        {openModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setOpenModal(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl"
            >
              <div className="relative bg-black rounded-lg overflow-hidden p-4">
                {/* Close button */}
                <button
                  onClick={() => setOpenModal(false)}
                  className="absolute top-3 right-3 z-10 text-white/60 hover:text-white transition"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                {loading ? (
                  <div className="flex justify-center items-center h-96">
                    <Loader2 className="animate-spin text-[#af601a]" size={48} />
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    controls={false}
                    playsInline
                    onEnded={() => setOpenModal(false)}
                    className="w-full aspect-[9/16] rounded-sm"
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
