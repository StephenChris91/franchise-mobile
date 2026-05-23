"use client";

import { useState, useCallback } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export function useAudioCompressor() {
  const [loading, setLoading] = useState(false);
  const ffmpeg = createFFmpeg({ log: true });

  const compressAudio = useCallback(async (file) => {
    if (typeof window === "undefined") return null;
    const maxSize = 60 * 1024 * 1024; // 60MB
    if (file.size < maxSize) return file;

    setLoading(true);
    try {
      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      ffmpeg.FS("writeFile", "input.mp3", await fetchFile(file));

      await ffmpeg.run(
        "-i",
        "input.mp3",
        "-b:a",
        "96k",
        "-acodec",
        "libmp3lame",
        "output.mp3"
      );

      const data = ffmpeg.FS("readFile", "output.mp3");
      return new File(
        [data.buffer],
        file.name.replace(/\.mp3$/, "-compressed.mp3"),
        {
          type: "audio/mpeg",
        }
      );
    } catch (err) {
      console.error("Compression failed:", err);
      return file;
    } finally {
      setLoading(false);
    }
  }, []);

  return { compressAudio, loading };
}
