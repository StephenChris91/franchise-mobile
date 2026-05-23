"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ImagePlus, X, Loader2 } from "lucide-react";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { Event } from "../../../db/schema";

const EVENT_TYPES = [
  { value: "service", label: "Sunday Service" },
  { value: "conference", label: "Conference" },
  { value: "outreach", label: "Outreach" },
  { value: "social", label: "Social" },
  { value: "training", label: "Training" },
  { value: "prayer", label: "Prayer" },
  { value: "other", label: "Other" },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["value"];

interface Props {
  event?: Event | null;
}

function toLocalDatetime(d: Date | string): string {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [eventType, setEventType] = useState<EventType>((event?.eventType as EventType) ?? "service");
  const [location, setLocation] = useState(event?.location ?? "");
  const [locationUrl, setLocationUrl] = useState(event?.locationUrl ?? "");
  const [startsAt, setStartsAt] = useState(event?.startsAt ? toLocalDatetime(event.startsAt) : "");
  const [endsAt, setEndsAt] = useState(event?.endsAt ? toLocalDatetime(event.endsAt) : "");
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "");
  const [rsvpRequired, setRsvpRequired] = useState(event?.rsvpRequired ?? false);
  const [isPublished, setIsPublished] = useState(event?.isPublished ?? false);
  const [coverImageUrl, setCoverImageUrl] = useState(event?.coverImageUrl ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Describe the event…" }),
    ],
    content: event?.description ? (() => {
      try { return JSON.parse(event.description); } catch { return event.description; }
    })() : "",
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none min-h-[120px] focus:outline-none text-gray-900 p-4" },
    },
  });

  function generateSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  const uploadCover = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError("Max 5 MB"); return; }
    setUploading(true);
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = { timestamp, folder: "franchise-events" };
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature, apiKey } = await signRes.json();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", "franchise-events");
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      setCoverImageUrl(data.secure_url);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  function handleSubmit() {
    if (!title || !startsAt || !endsAt || !location) {
      setError("Title, location and dates are required");
      return;
    }
    const description = JSON.stringify(editor?.getJSON() ?? {});
    const data = {
      title,
      slug: slug || generateSlug(title),
      description,
      eventType,
      location,
      locationUrl: locationUrl || undefined,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      capacity: capacity ? Number(capacity) : undefined,
      rsvpRequired,
      isPublished,
      coverImageUrl: coverImageUrl || undefined,
    };

    setError("");
    startTransition(async () => {
      try {
        if (isEdit && event) {
          await updateEvent(event.id, data);
          router.push("/admin/events");
        } else {
          await createEvent(data);
          router.push("/admin/events");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Basic Info</h2>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (!isEdit) setSlug(generateSlug(e.target.value)); }}
            placeholder="Event title"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          />
          <p className="text-xs text-gray-400 mt-1">Will appear as /events/{slug || "…"}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex gap-1 px-3 pt-2 border-b border-gray-100 pb-2">
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bold") && "bg-gray-100 text-gray-900")}>
                <Bold size={14} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("italic") && "bg-gray-100 text-gray-900")}>
                <Italic size={14} />
              </button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bulletList") && "bg-gray-100 text-gray-900")}>
                <List size={14} />
              </button>
            </div>
            <div onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Date & location */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Date & Location</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Starts *</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Ends *</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Location *</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue name or 'Online'"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Location URL</label>
          <input
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            placeholder="Google Maps or Zoom link"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          />
        </div>
      </div>

      {/* Cover image */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Cover Image</h2>
        {coverImageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setCoverImageUrl("")}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ) : (
          <label className={cn("flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#af601a]/50 transition", uploading && "opacity-50 pointer-events-none")}>
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-gray-400" />
            ) : (
              <>
                <ImagePlus size={24} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">Click to upload cover image</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
            />
          </label>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Settings</h2>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Capacity (optional)</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Leave blank for unlimited"
            min={1}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">RSVP Required</p>
            <p className="text-xs text-gray-400">Members must RSVP to attend</p>
          </div>
          <Switch checked={rsvpRequired} onCheckedChange={setRsvpRequired} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Published</p>
            <p className="text-xs text-gray-400">Visible on public events page</p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || uploading}
          className="flex-1 py-2.5 bg-[#af601a] text-white rounded-lg text-sm font-semibold hover:bg-[#c47020] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? "Saving…" : isEdit ? "Update Event" : "Create Event"}
        </button>
      </div>
    </div>
  );
}
