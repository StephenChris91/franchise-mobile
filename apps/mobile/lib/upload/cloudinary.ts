/**
 * Cloudinary upload helper.
 * Flow:
 *  1. Call api.profile.signUploadUrl() → get { signature, apiKey, cloudName, timestamp, folder }
 *  2. Build a FormData payload and POST directly to Cloudinary's upload API
 *  3. Return the secure_url from Cloudinary's response
 */
import { api } from "../api/client";

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(
  localUri: string,
  folder = "franchise/posts"
): Promise<UploadResult> {
  // 1. Get a signed upload ticket from our server
  const signed = await api.profile.signUploadUrl({
    folder,
    timestamp: Math.floor(Date.now() / 1000),
  });

  // 2. Build multipart form
  const form = new FormData();
  // React Native FormData accepts { uri, type, name }
  form.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as unknown as Blob);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);

  // 3. Upload directly to Cloudinary
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message: string } };
    throw new Error(err.error?.message ?? "Cloudinary upload failed");
  }

  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}
