"use client";

import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { handleSermonChange, handleSermonUpload } from "./helpers";

export default function SermonsUploadPage() {
  const audioRef = useRef();
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    speaker: "",
    date: "",
    audioFile: null,
    thumbnailFile: null,
    categories: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      speaker: "",
      date: "",
      audioFile: null,
      thumbnailFile: null,
      categories: "",
    });
    setDuration(null);
    if (audioRef?.current) {
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  };

  const fieldClass = "rounded-sm border-gray-300 bg-gray-50 text-gray-900 focus-visible:ring-[#af601a]";

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 bg-white rounded shadow pb-44">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Upload New Sermon</h2>

      <form
        onSubmit={(e) =>
          handleSermonUpload(e, form, duration, setLoading, resetForm)
        }
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title" className="text-gray-700">Sermon Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter sermon title"
            value={form.title}
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            required
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="speaker" className="text-gray-700">Speaker</Label>
          <Input
            id="speaker"
            name="speaker"
            placeholder="Speaker name"
            value={form.speaker}
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categories" className="text-gray-700">Categories</Label>
          <Input
            id="categories"
            name="categories"
            placeholder="e.g. Faith, Leadership, Healing"
            value={form.categories}
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date" className="text-gray-700">Sermon Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audioFile" className="text-gray-700">Audio File (.mp3)</Label>
          <Input
            id="audioFile"
            name="audioFile"
            type="file"
            accept=".mp3"
            required
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            className={`${fieldClass} cursor-pointer`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="thumbnailFile" className="text-gray-700">Thumbnail Image</Label>
          <Input
            id="thumbnailFile"
            name="thumbnailFile"
            type="file"
            accept="image/*"
            onChange={(e) => handleSermonChange(e, setForm, audioRef, setDuration)}
            className={`${fieldClass} cursor-pointer`}
          />
        </div>

        {duration && (
          <p className="text-sm text-gray-600">
            Duration: <strong>{Math.floor(duration / 60)} mins</strong>
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !duration}
          variant="secondary"
          className="cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Uploading…
            </>
          ) : (
            "Upload Sermon"
          )}
        </Button>
      </form>

      {/* Hidden audio element to read duration metadata */}
      <audio ref={audioRef} hidden />
    </div>
  );
}
