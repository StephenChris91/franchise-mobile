// AudioPlayerContext.js
"use client";

import React, { createContext, useContext, useState } from "react";

const AudioPlayerContext = createContext();

export function AudioPlayerProvider({ children }) {
  const [currentAudio, setCurrentAudio] = useState(null);

  const setAudio = (audio) => {
    setCurrentAudio(audio); // just metadata, no <audio>
  };

  const clearAudio = () => {
    setCurrentAudio(null);
  };

  return (
    <AudioPlayerContext.Provider value={{ currentAudio, setAudio, clearAudio }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => useContext(AudioPlayerContext);
