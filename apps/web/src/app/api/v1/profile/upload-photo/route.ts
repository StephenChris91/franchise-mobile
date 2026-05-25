import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ok, err, withApproved } from "@/lib/api/middleware";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  return withApproved(req, async (_req, user) => {
    // Build the exact params we will sign — generate server-side so that
    // the signature, timestamp, and folder are always consistent.
    // Never trust client-supplied values for params that affect the signature.
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `franchise/profiles/${user.sub}`;

    const paramsToSign: Record<string, unknown> = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return ok({
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      timestamp,
      folder,
    });
  });
}
