import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions } from "cloudinary";
import { db, sermons } from "@franchise/db";

// Lazy Cloudinary config — env vars absent at build time
function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
  return cloudinary;
}

function uploadStream(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    getCloudinary()
      .uploader.upload_stream(options, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve(result as { secure_url: string; public_id: string });
      })
      .end(buffer);
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();

  const title = (formData.get("title") as string | null)?.trim();
  const speaker = ((formData.get("speaker") as string | null) ?? "").trim();
  const date = (formData.get("date") as string | null)?.trim();
  const duration = parseInt((formData.get("duration") as string | null) ?? "0");
  const audioFile = formData.get("audioFile") as File | null;
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const rawCategories = (formData.get("categories") as string | null) ?? "";

  if (!title || !date || !audioFile) {
    return Response.json({ error: "Missing required fields: title, date, audioFile" }, { status: 400 });
  }

  const categories = rawCategories
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // ── Upload audio to Cloudinary ────────────────────────────────────────────
  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  const audioResult = await uploadStream(audioBuffer, {
    resource_type: "video", // Cloudinary uses "video" for audio files
    folder: "sermons/audio",
    public_id: `${Date.now()}-${audioFile.name.replace(/\.[^.]+$/, "")}`,
    format: "mp3",
  });

  // ── Upload thumbnail to Cloudinary (optional) ────────────────────────────
  let thumbnailUrl = "/assets/sermon-fallback.jpg";
  if (thumbnailFile && thumbnailFile.size > 0) {
    const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
    const thumbResult = await uploadStream(thumbBuffer, {
      resource_type: "image",
      folder: "sermons/thumbnails",
    });
    thumbnailUrl = thumbResult.secure_url;
  }

  // ── Insert sermon metadata into Neon ─────────────────────────────────────
  await db.insert(sermons).values({
    title,
    speaker,
    date,
    duration,
    audioUrl: audioResult.secure_url,
    thumbnail: thumbnailUrl,
    categories,
  });

  return Response.json({ success: true }, { status: 201 });
}
