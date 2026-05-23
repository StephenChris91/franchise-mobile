import { db, groups, users } from "./index";
import { eq } from "drizzle-orm";

const SEED_GROUPS = [
  {
    slug: "franchise-kids",
    name: "Franchise Kids",
    description: "A community for parents, teachers, and leaders in our children's ministry. Share resources, prayer requests, and updates for our youngest members.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "franchise-youth",
    name: "Franchise Youth",
    description: "The hub for our youth ministry — events, Bible studies, testimonies, and everything that keeps our young adults growing in faith.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "franchise-adults",
    name: "Franchise Adults",
    description: "For our adult congregation — life groups, announcements, devotionals, and connection beyond Sunday service.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "choir",
    name: "Choir",
    description: "The voice of Franchise Church. Rehearsal schedules, song selections, team announcements, and worship reflections.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "ushers",
    name: "Ushers",
    description: "The welcoming face of Franchise Church. Duty rosters, training updates, and team coordination.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "prayer-team",
    name: "Prayer Team",
    description: "Dedicated intercessors who carry the heartbeat of this church in prayer. Prayer requests, watches, and reports.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "media-team",
    name: "Media Team",
    description: "The technical backbone of our services. Graphics, audio, video, streaming, and social media — all coordinated here.",
    groupType: "ministry" as const,
    visibility: "public" as const,
  },
  {
    slug: "new-members",
    name: "New Members",
    description: "A warm welcome to the Franchise family. This group helps new members settle in, find their place, and connect with others.",
    groupType: "small_group" as const,
    visibility: "public" as const,
  },
];

async function seed() {
  console.log("🌱 Seeding groups…");

  // Find or use a placeholder admin user ID for createdBy
  const adminUser = await db
    .select({ id: users.id })
    .from(users)
    .limit(1)
    .then((r) => r[0]);

  const createdBy = adminUser?.id ?? null;

  for (const group of SEED_GROUPS) {
    await db
      .insert(groups)
      .values({ ...group, createdBy })
      .onConflictDoNothing();
    console.log(`  ✓ ${group.name}`);
  }

  console.log(`✅ ${SEED_GROUPS.length} groups seeded.`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
