/**
 * Cloudinary upload helper.
 *
 * Flow (server-proxied — no client-side signing):
 *   1. Build a multipart FormData with the local image URI
 *   2. POST it to our own backend at /api/v1/upload
 *   3. The backend uploads to Cloudinary using its credentials and returns
 *      { url, publicId }
 *
 * This replaces the old signed-upload flow which was fragile due to
 * timestamp/folder mismatches between signing and upload.
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
  return api.uploadFile(localUri, folder);
}
