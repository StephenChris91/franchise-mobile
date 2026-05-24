import { NextRequest } from "next/server";
import { sql, eq, and, or, ilike } from "drizzle-orm";
import { db, socialPosts, profiles, events, groups } from "@franchise/db";
import { ok, err, withAuth } from "@/lib/api/middleware";

const MAX_RESULTS = 20;

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "all"; // "all" | "posts" | "events" | "groups" | "members"

    if (!q || q.length < 2) {
      return err("BAD_REQUEST", "Query must be at least 2 characters", 400);
    }

    const term = `%${q}%`;
    const results: {
      type: string;
      id: string;
      title: string;
      subtitle?: string;
      imageUrl?: string | null;
      slug?: string | null;
    }[] = [];

    if (type === "all" || type === "posts") {
      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          postType: socialPosts.postType,
          authorUsername: profiles.username,
          authorFullName: profiles.fullName,
          authorPhoto: profiles.photoUrl,
          createdAt: socialPosts.createdAt,
        })
        .from(socialPosts)
        .leftJoin(profiles, eq(socialPosts.authorId, profiles.userId))
        .where(
          and(
            eq(socialPosts.isHidden, false),
            ilike(socialPosts.content, term)
          )
        )
        .orderBy(sql`${socialPosts.createdAt} DESC`)
        .limit(MAX_RESULTS);

      for (const p of posts) {
        results.push({
          type: "post",
          id: p.id,
          title: p.content.slice(0, 80) + (p.content.length > 80 ? "…" : ""),
          subtitle: p.authorFullName ?? p.authorUsername ?? undefined,
          imageUrl: p.authorPhoto,
        });
      }
    }

    if (type === "all" || type === "events") {
      const eventRows = await db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          coverImageUrl: events.coverImageUrl,
          startsAt: events.startsAt,
        })
        .from(events)
        .where(
          and(
            eq(events.isPublished, true),
            or(ilike(events.title, term), ilike(events.description, term))
          )
        )
        .orderBy(sql`${events.startsAt} ASC`)
        .limit(MAX_RESULTS);

      for (const e of eventRows) {
        results.push({
          type: "event",
          id: e.id,
          slug: e.slug,
          title: e.title,
          subtitle: e.startsAt.toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          imageUrl: e.coverImageUrl,
        });
      }
    }

    if (type === "all" || type === "groups") {
      const groupRows = await db
        .select({
          id: groups.id,
          slug: groups.slug,
          name: groups.name,
          description: groups.description,
          coverImageUrl: groups.coverImageUrl,
          memberCount: groups.memberCount,
        })
        .from(groups)
        .where(
          and(
            eq(groups.visibility, "public"),
            or(ilike(groups.name, term), ilike(groups.description, term))
          )
        )
        .limit(MAX_RESULTS);

      for (const g of groupRows) {
        results.push({
          type: "group",
          id: g.id,
          slug: g.slug,
          title: g.name,
          subtitle: `${g.memberCount} member${g.memberCount === 1 ? "" : "s"}`,
          imageUrl: g.coverImageUrl || null,
        });
      }
    }

    if (type === "all" || type === "members") {
      const members = await db
        .select({
          userId: profiles.userId,
          username: profiles.username,
          fullName: profiles.fullName,
          photoUrl: profiles.photoUrl,
          ministry: profiles.ministry,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.approvalStatus, "approved"),
            or(ilike(profiles.fullName, term), ilike(profiles.username, term))
          )
        )
        .limit(MAX_RESULTS);

      for (const m of members) {
        results.push({
          type: "member",
          id: m.userId,
          slug: m.username,
          title: m.fullName,
          subtitle: `@${m.username}`,
          imageUrl: m.photoUrl,
        });
      }
    }

    return ok({ query: q, results });
  });
}
