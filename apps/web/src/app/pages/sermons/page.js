"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import SermonCard from "@/components/sermons/SermonsCard";
import SermonFilters from "@/components/sermons/SermonFilters";
import AudioPlayerBar from "@/components/sermons/AudioPlayerBar";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SermonsPage() {
  const [sermons, setSermons] = useState([]);
  const [filteredSermons, setFilteredSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);
  const { setAudio } = useAudioPlayer();
  const observerRef = useRef();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const limit = 8;

  const fetchSermons = async (offset = 0) => {
    const res = await fetch(
      `${backendUrl}/api/sermons?offset=${offset}&limit=${limit}`
    );
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch");

    setPagination(data.pagination);
    setHasMore(data.pagination?.hasMore ?? false);

    return data.sermons || [];
  };

  useEffect(() => {
    (async () => {
      try {
        const initialSermons = await fetchSermons();
        setSermons(initialSermons);
        setFilteredSermons(initialSermons);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load sermons");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          setLoadingMore(true);
          try {
            const offset = pagination?.nextOffset || sermons.length;
            const moreSermons = await fetchSermons(offset);

            if (moreSermons.length === 0) {
              setHasMore(false);
              toast.info("All sermons loaded");
              return;
            }

            const updated = [...sermons, ...moreSermons];
            setSermons(updated);
            setFilteredSermons(updated);
          } catch (err) {
            toast.error("Failed to load more sermons");
            console.error("Load more error:", err);
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { rootMargin: "100px" }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, [sermons, loadingMore, hasMore, pagination]);

  const handlePlay = (sermon) => {
    setAudio(sermon);
  };

  return (
    <section className="px-6 py-24 bg-[#ededed]">
      <ToastContainer position="bottom-center" autoClose={3000} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-normal text-gray-700 leading-tight">
              Life Giving <span className="text-[#af601a]">Messages</span>
            </h2>
            <p className="text-gray-600 mt-4 text-sm md:text-base max-w-lg">
              Listen to life-transforming messages from Pastor Tosin Martins and
              other anointed ministers
            </p>
          </div>
          <div className="w-full md:w-[500px] h-[300px] rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/zZedb_mXStc?t=695&autoplay=1&mute=1&controls=0&loop=1&playlist=zZedb_mXStc&modestbranding=1&rel=0"
              title="Sermon Preview"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Filters */}
        {!loading && sermons.length > 0 && (
          <SermonFilters allSermons={sermons} onFilter={setFilteredSermons} />
        )}

        {/* Sermon Grid */}
        {loading ? (
          <div className="flex justify-center mt-20">
            <Loader2 className="animate-spin text-[#af601a]" size={48} />
          </div>
        ) : filteredSermons.length > 0 ? (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-6 py-16 max-w-7xl mx-auto">
              {filteredSermons.map((sermon) => (
                <SermonCard
                  key={sermon.id}
                  sermon={sermon}
                  onPlay={handlePlay}
                />
              ))}
            </section>
            <div ref={observerRef} className="h-1" />
            {loadingMore && (
              <div className="flex justify-center mt-4">
                <Loader2 className="animate-spin text-gray-500" size={28} />
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 mt-20">No sermons found.</p>
        )}

        <AudioPlayerBar />
      </div>
    </section>
  );
}
