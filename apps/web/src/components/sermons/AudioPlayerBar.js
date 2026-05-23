"use client";

import React, { useRef, useEffect, useState } from "react";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import {
  HiPlay,
  HiPause,
  HiX,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

export default function AudioPlayerBar() {
  const { currentAudio, clearAudio } = useAudioPlayer();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, [currentAudio?.audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime += seconds;
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    clearAudio();
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "00:00";
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);

    return hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`;
  };

  if (!currentAudio?.audioUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-black z-[9999] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT: Thumbnail and Title */}
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={currentAudio.thumbnail}
              alt={currentAudio.title}
              className="w-12 h-12 object-cover rounded-xs"
            />
            <div className="truncate">
              <p className="font-semibold truncate text-gray-50">
                {currentAudio.title}
              </p>
              {currentAudio.speaker && (
                <p className="text-sm text-[#af601a] truncate">
                  {currentAudio.speaker}
                </p>
              )}
            </div>
          </div>

          {/* CENTER: Player */}
          <div className="flex-1 flex flex-col gap-1 items-center">
            <div className="flex items-center gap-4 text-2xl text-white">
              <button onClick={() => skip(-10)} title="Back 10s">
                <HiChevronLeft />
              </button>

              <button onClick={togglePlayPause} title="Play/Pause">
                {isPlaying ? <HiPause /> : <HiPlay />}
              </button>

              <button onClick={() => skip(10)} title="Forward 10s">
                <HiChevronRight />
              </button>
            </div>

            <div className="flex items-center gap-2 w-full">
              <span className="text-xs font-mono w-[48px] text-gray-50">
                {formatTime(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={seek}
                className="flex-1 h-1 appearance-none bg-gray-300 rounded-lg"
              />
              <span className="text-xs font-mono w-[48px] text-right text-gray-50">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* RIGHT: Close */}
          <div className="shrink-0">
            <button
              onClick={handleClose}
              className="text-gray-50 text-xl hover:text-red-500"
              title="Close Player"
            >
              <HiX />
            </button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={currentAudio.audioUrl} preload="auto" />
    </div>
  );
}
