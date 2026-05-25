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
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  // Fail fast with a clear message if credentials are missing
  if (
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !(process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
  ) {
    return err(
      "CONFIGURATION_ERROR",
      "Cloudinary credentials are not configured on the server. Add CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to Vercel environment variables.",
      500
    );
  }

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
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
      });

      return ok({ url: result.secure_url, publicId: result.public_id });
    } catch (e) {
      // Cloudinary SDK throws plain objects, not Error instances
      let message = "Cloudinary upload failed";
      if (e instanceof Error) {
        message = e.message;
      } else if (e && typeof e === "object") {
        const cErr = e as Record<string, unknown>;
        if (typeof cErr.message === "string") message = cErr.message;
        else if (cErr.error && typeof (cErr.error as Record<string, unknown>).message === "string") {
          message = (cErr.error as Record<string, unknown>).message as string;
        } else if (typeof cErr.http_code === "number") {
          message = `Cloudinary error HTTP ${cErr.http_code}`;
        }
      }
      console.error("[upload] Cloudinary error:", e);
      return err("UPLOAD_FAILED", message, 500);
    }
  });
}
