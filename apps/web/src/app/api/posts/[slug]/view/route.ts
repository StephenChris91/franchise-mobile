import { NextRequest, NextResponse } from "next/server";
import { db, postViews } from "../../../../../../db";
import { auth } from "../../../../../../auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const sessionId: string | undefined = body?.sessionId;

    if (!slug || !sessionId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    // Insert — unique constraint on (post_slug, session_id) silently ignores duplicates
    await db
      .insert(postViews)
      .values({ postSlug: slug, sessionId, userId })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[view route]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
