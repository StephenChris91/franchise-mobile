import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.approvalStatus !== "approved") {
    return NextResponse.json({ error: "Account not approved" }, { status: 403 });
  }

  const { paramsToSign } = await req.json();
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
