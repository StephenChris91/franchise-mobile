import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ok, err, withApproved } from "@/lib/api/middleware";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const paramsToSign = (body as { paramsToSign?: Record<string, unknown> }).paramsToSign;
    if (!paramsToSign) return err("BAD_REQUEST", "paramsToSign is required", 400);

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

    return ok({
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      timestamp: Math.round(Date.now() / 1000),
      folder: `franchise/profiles/${user.sub}`,
    });
  });
}
