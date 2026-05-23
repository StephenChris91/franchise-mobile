"use client";

import { useState, useCallback } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export function useFFmpegCompressor() {
  const [loading, setLoading] = useState(false);
  const ffmpeg = createFFmpeg({ log: true });

  const compressVideo = useCallback(async (file) => {
    if (typeof window === "undefined") return null;

    setLoading(true);
    try {
      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      ffmpeg.FS("writeFile", "input.mp4", await fetchFile(file));

      await ffmpeg.run(
        "-i",
        "input.mp4",
        "-vcodec",
        "libx264",
        "-crf",
        "28",
        "output.mp4"
      );

      const data = ffmpeg.FS("readFile", "output.mp4");
      const compressedBlob = new Blob([data.buffer], { type: "video/mp4" });

      return compressedBlob;
    } catch (err) {
      console.error("Compression failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { compressVideo, loading };
}
