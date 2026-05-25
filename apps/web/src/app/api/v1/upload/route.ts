/**
 * POST /api/v1/upload
 *
 * Proxy image upload to Cloudinary — the mobile client sends the image here
 * and we upload it server-side using our credentials.  This avoids all
 * signed-upload complexity (mismatched timestamps, missing secrets, etc.).
 *
 * Body: multipart/form-data
 *   file   — image file (JPEG / PNG)
 *   folder — Cloudinary folder path (e.g. "franchise/posts")
 *
 * Response: { url: string, publicId: string }
 */
import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ok, err, withApproved } from "@/lib/api/middleware";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  return withApproved(request, async (req) => {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err("BAD_REQUEST", "Expected multipart/form-data", 400);
    }

    const file = formData.get("file") as File | null;
    if (!file) return err("BAD_REQUEST", "file field is required", 400);

    const folder = (formData.get("folder") as string | null) ?? "franchise/posts";

    // Convert file buffer → base64 data URI for the Cloudinary SDK
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    try {
      // Upload directly using server credentials — no signature needed
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
      });

      return ok({ url: result.secure_url, publicId: result.public_id });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Cloudinary upload failed";
      return err("UPLOAD_FAILED", message, 500);
    }
  });
}
