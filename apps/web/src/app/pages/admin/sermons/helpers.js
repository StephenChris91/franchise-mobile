"use client";

export const handleSermonChange = (e, setForm, audioRef, setDuration) => {
  const { name, value, files } = e.target;

  if (name === "audioFile") {
    const file = files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, audioFile: file }));
      const url = URL.createObjectURL(file);
      if (audioRef?.current) {
        audioRef.current.src = url;
        audioRef.current.onloadedmetadata = () => {
          const secs = Math.round(audioRef.current.duration || 0);
          setDuration(secs);
        };
      }
    }
  } else if (name === "thumbnailFile") {
    setForm((prev) => ({ ...prev, thumbnailFile: files?.[0] || null }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

export const handleSermonUpload = async (
  e,
  form,
  duration,
  setLoading,
  resetForm
) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { title, speaker, date, audioFile, thumbnailFile, categories } = form;

    if (!title?.trim() || !date?.trim() || !audioFile || !duration) {
      alert("Please complete all required fields before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("speaker", speaker || "");
    formData.append("date", date);
    formData.append("duration", String(duration));
    formData.append("categories", categories || "");
    formData.append("audio", audioFile);
    if (thumbnailFile) formData.append("thumbnailFile", thumbnailFile);

    // 👉 Point to your Express API (set this in .env.local)
    const base = process.env.NEXT_PUBLIC_BACKEND_URL; // e.g. http://localhost:4000
    const res = await fetch(`${base}/api/sermons`, {
      method: "POST",
      body: formData,
      // Note: no Content-Type header; the browser sets the multipart boundary
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");

    alert("✅ Sermon uploaded successfully");
    resetForm();
  } catch (err) {
    console.error("Upload Error:", err);
    alert(`❌ Upload failed: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
