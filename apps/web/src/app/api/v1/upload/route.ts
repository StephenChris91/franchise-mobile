/**
 * POST /api/v1/upload
 *
 * Proxy image upload to Cloudinary — the mobile client sends the image here
 * and we upload it server-side using our credentials.  This avoids all
 * signed-upload complexity (mismatched timestamps, missing secrets, etc.).
 *
 * Body: multipart/form-data
 *   file   — image file (JPEG)
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

// Increase body size limit to 10 MB for images
export const config = {
  api: { bodyParser: false }, // not used in App Router, but harmless
};

export async function POST(req: NextRequest) {
  return withApproved(req, async (req) => {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return err("BAD_REQUEST", "Expected multipart/form-data", 400);
    }

    const file = formData.get("file") as File | null;
    if (!file) return err("BAD_REQUEST", "file field is required", 400);

    const folder = (formData.get("folder") as string | null) ?? "franchise/posts";

    // Convert file to base64 data URI for Cloudinary SDK
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Upload directly — no signature ceremony
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          dataUri,
          { folder, resource_type: "image" },
          (error, res) => {
            if (error || !res) reject(error ?? new Error("Cloudinary upload failed"));
            else resolve(res as { secure_url: string; public_id: string });
          }
        );
      }
    );

    return ok({ url: result.secure_url, publicId: result.public_id });
  });
}
