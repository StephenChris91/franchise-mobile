import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@franchise/auth";
import type { AccessTokenPayload } from "@franchise/auth";

export type AuthedRequest = NextRequest & { user: AccessTokenPayload };

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function err(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: AccessTokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return err("UNAUTHORIZED", "Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const user = await verifyAccessToken(token);
  if (!user) {
    return err("UNAUTHORIZED", "Invalid or expired access token", 401);
  }

  return handler(req, user);
}

export async function withApproved(
  req: NextRequest,
  handler: (req: NextRequest, user: AccessTokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    if (user.approvalStatus !== "approved") {
      return err("FORBIDDEN", "Account pending approval", 403);
    }
    return handler(req, user);
  });
}

export async function withAdmin(
  req: NextRequest,
  handler: (req: NextRequest, user: AccessTokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    if (user.role !== "admin" && user.role !== "pastor") {
      return err("FORBIDDEN", "Admin access required", 403);
    }
    return handler(req, user);
  });
}

// Decode cursor: base64({ id, createdAt })
export function decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8")) as { id: string; createdAt: string };
    return { id: decoded.id, createdAt: new Date(decoded.createdAt) };
  } catch {
    return null;
  }
}

export function encodeCursor(id: string, createdAt: Date): string {
  return Buffer.from(JSON.stringify({ id, createdAt: createdAt.toISOString() })).toString("base64url");
}
