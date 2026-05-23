"use server";

import { db, blogPosts } from "../../../db";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const role = session.user.role;
  if (role !== "admin" && role !== "pastor") throw new Error("Unauthorized");
}

const SAMPLE_POSTS = [
  {
    title: "Faith That Moves Mountains: A Deep Dive into Matthew 17:20",
    slug: "faith-that-moves-mountains",
    excerpt:
      "What does Jesus actually mean when He says faith the size of a mustard seed can move mountains? This isn't hyperbole — it is a precise spiritual truth about the nature of genuine faith.",
    author: "Pastor Tosin Martins",
    coverImage: "",
    category: "sermon" as const,
    tags: "faith,Matthew,kingdom,prayer",
    featured: true,
    isPublished: true,
    publishedAt: new Date("2025-05-10"),
    content: `## The Smallest Seed, The Greatest Power

In Matthew 17:20, Jesus says something that has puzzled, challenged, and inspired believers for two millennia:

> *"Because of your little faith. For truly, I say to you, if you have faith like a grain of mustard seed, you will say to this mountain, 'Move from here to there,' and it will move, and nothing will be impossible for you."*

The disciples had just failed to cast a demon out of a boy. They came to Jesus privately, embarrassed, asking why they couldn't do it. And Jesus doesn't say they lacked technique, or prayer volume, or spiritual gifting. He says they lacked **faith**.

But here's what stops many people: He then says even mustard-seed faith can move mountains. If a tiny amount of faith is sufficient, why were they failing?

---

## The Quality of Faith, Not the Quantity

The Greek word used here for "little faith" is **oligopistia** — it doesn't mean *small in size*, it means *incomplete, divided, vacillating*. Their faith was fragmented. They believed in Jesus but doubted in the moment of action.

Contrast this with the mustard seed. The mustard seed is tiny, yes — but it is **whole**. Undivided. Complete in itself. It has no doubt about what it is supposed to become. It does not alternate between growing and not growing. It simply does what it was created to do, with total commitment.

This is what Jesus is calling us to. Not more faith in measure, but *purer* faith in quality.

---

## Three Characteristics of Mustard-Seed Faith

### 1. It is Rooted in the Right Object

A mustard seed does not grow because the gardener believes in the mustard seed. It grows because of what it *is* — a living thing placed in the right environment.

Our faith moves mountains not because of its own power, but because of *Who* it is placed in. Faith directed at Jesus — at the living, risen, mountain-moving God — is faith that works. Misdirected faith, no matter how fervent, is just religious emotion.

Ask yourself: Is my faith placed in my prayer, my fasting, my confession? Or is it placed in the character and faithfulness of God?

### 2. It Acts Before It Sees

The disciples were waiting for proof before they acted. The mustard seed does not wait to see if the soil is good. It pushes down roots into the darkness and trusts the process.

Biblical faith always involves action before evidence:
- **Noah** built a boat on dry land.
- **Abraham** left his home without a destination.
- **Peter** stepped out of a boat onto water — not after walking on water, but *before*.

Your mountain won't move while you're waiting for it to wobble first.

### 3. It Persists Through Opposition

A mustard seed will break through concrete if you give it enough time. Jesus compares the kingdom of heaven to this plant in Matthew 13:31-32 — something small that becomes *"the largest of garden plants"* where birds come and nest.

Persistence is built into the nature of genuine faith. It is not passive hoping. It is active, daily, sometimes struggle-filled trust that does not quit.

---

## What Is Your Mountain?

The question is not whether faith can move mountains — Jesus settles that definitively. The question is whether you have located your mountain and are speaking to it.

Mountains in your life might be:
- A health diagnosis that says "this is permanent"
- A broken relationship that seems beyond repair
- A financial situation that statistics say has no exit
- A generational pattern that has run through your family for decades

Jesus does not say *pray about your mountain*, or *accept your mountain*. He says **speak to it**. There is a prophetic authority in the mouth of the believer that the mountain is subject to — not because of who *you* are, but because of Who lives in you.

---

## A Practical Response

This week, I want to challenge you to do three things:

1. **Name your mountain.** Be specific. Faith is not vague wishing. It is targeted, precise trust directed at a named obstacle.

2. **Speak to it, not about it.** Stop discussing your problem with everyone and start declaring God's word over it. The disciples were talking *about* what they couldn't do. Jesus spoke *to* the problem.

3. **Pray with the kind of prayer that expects an answer.** Not the prayer of resignation — "Lord, if it is your will..." when you haven't sought His will. But the prayer of a child who knows their Father and trusts His nature.

Faith the size of a mustard seed. Undivided. Rooted. Speaking. That is all it takes.

---

*This message was preached at Franchise Church, Lagos. We believe the Word of God is alive and active — sharper than any two-edged sword. Share this teaching with someone who needs to move their mountain today.*`,
  },
  {
    title: "His Mercies Are New Every Morning",
    slug: "his-mercies-are-new",
    excerpt:
      "Lamentations 3:22-23 is one of the most reassuring passages in all of Scripture — written, remarkably, in the middle of devastation. What does it mean to start each day anchored in God's faithfulness?",
    author: "Pastor Tosin Martins",
    coverImage: "",
    category: "devotional" as const,
    tags: "mercy,faithfulness,Lamentations,morning,renewal",
    featured: false,
    isPublished: true,
    publishedAt: new Date("2025-05-18"),
    content: `*Lamentations 3:22-23 — "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness."*

---

There is something almost shocking about where this verse appears.

Lamentations is not a book of triumph. It is a book of grief — written in the aftermath of Jerusalem's destruction, when the city lay in ruins, when the temple was ash, and when God's people had been dragged into exile. Jeremiah, the author, calls himself a man who has *"seen affliction by the rod of [God's] wrath"* (3:1). He describes walking in darkness with no light.

And yet, **in the middle of this**, he writes one of the most hope-filled statements in all of Scripture.

This is important. These words were not written from a mountaintop. They were written from the valley. That changes everything about how we receive them.

---

## The Word "Steadfast"

The Hebrew word behind "steadfast love" is **hesed** — and it is one of the richest words in the entire Old Testament. It combines ideas of loyalty, covenant faithfulness, kindness, and mercy into one concept that has no single English equivalent.

Hesed is the love that a parent has for a child — not because the child has earned it, but because of the covenant bond between them. It is the love that does not leave when things get hard. It is the love that says *I am committed to you regardless of your performance*.

The verse says this love *"never ceases."* In Hebrew, the phrase carries the sense of something that is simply incapable of ending — not because it is unlikely to end, but because ending is not in its nature.

---

## New Every Morning

The phrase *"new every morning"* is not just poetic. It is theological.

In the ancient world, each new day was understood as a gift. The sun rising was not taken for granted — it was evidence that the creator God had chosen to continue sustaining life for another day. So when Jeremiah says God's mercies are *new every morning*, he is saying: **every sunrise is a fresh act of God's faithfulness**.

You do not carry yesterday's sins into today's grace. You do not approach God on Monday with the grace He extended last Friday. Every morning, the supply is replenished. Every morning, the slate is available to be wiped clean. Every morning, you have the same access to mercy as the greatest saints who ever lived — because it is not about your track record; it is about His character.

---

## A Morning Practice

Here is a simple devotional practice rooted in this passage:

**Before you pick up your phone each morning**, pause for 60 seconds and pray something like this:

> *"Lord, I receive your mercy for this day. Not yesterday's — today's. I bring nothing to you except my need. You bring everything I could ever require. Great is your faithfulness. Let me walk in it today."*

That is it. Sixty seconds. But done with sincerity, over weeks and months, this practice can fundamentally reorient how you approach difficulty, failure, and the ordinary moments of life.

---

## For the Person Who Failed Yesterday

If you are reading this carrying the weight of something you said, did, or failed to do — hear this:

Jeremiah wrote these words after a national catastrophe that was, in part, the result of Israel's persistent unfaithfulness. And yet he still lifts his eyes to the mercy of God. He still calls it *steadfast*. He still names it *new*.

Your failure is not larger than God's mercy. Your mistakes are not so catastrophic that you have crossed some invisible line beyond which God's hesed cannot reach. If anything, the depths of human failure are precisely where the depths of divine mercy are most clearly seen.

Come to the table. The mercies are new. They were prepared for you before you woke up this morning.

---

*Great is His faithfulness. Let that be the word that shapes your day.*`,
  },
  {
    title: "Lagos Mainland Mission 2025: Join Us on the Streets",
    slug: "lagos-mainland-mission-2025",
    excerpt:
      "This July, Franchise Church is taking the gospel beyond our walls and into the streets of Lagos Mainland. Here is everything you need to know about our biggest outreach event of the year.",
    author: "Franchise Church",
    coverImage: "",
    category: "announcement" as const,
    tags: "outreach,Lagos,evangelism,mission,community",
    featured: false,
    isPublished: true,
    publishedAt: new Date("2025-05-22"),
    content: `## We Are Going to the Streets

The vision of Franchise Church has always been clear: *all men celebrating endless life in Christ*. That vision does not end at our doors. It extends into every neighbourhood, every bus stop, every market, and every community in Lagos.

This July, we are putting that vision into action in a bigger way than ever before.

**The Lagos Mainland Mission 2025** is a five-day outreach campaign that will take our teams into four local government areas across Lagos Mainland — Surulere, Mushin, Agege, and Oshodi-Isolo. We will go where people live, not wait for them to find us.

---

## What We Will Be Doing

### Street Evangelism
Our trained evangelism teams will conduct structured open-air meetings at major pedestrian intersections, markets, and bus depots. Every meeting will include worship, a brief gospel message, and an opportunity to respond.

### Free Medical Outreach
In partnership with Christian medical professionals, we will be offering free basic health screenings, blood pressure checks, blood sugar tests, and general consultations at each location.

### Children's Programming
We have a dedicated children's team that will run engaging, faith-based activities for kids at each outreach point, ensuring that families can participate without leaving their children unattended.

### Food Distribution
On the final day — Saturday, July 26 — we will distribute food packs to vulnerable families identified in partnership with local community leaders. We are targeting 500 families this year.

---

## The Schedule

| Date | Location | Time |
|------|----------|------|
| Tuesday, July 22 | Surulere (Ojuelegba) | 9:00 AM – 2:00 PM |
| Wednesday, July 23 | Mushin (Idi-Oro) | 9:00 AM – 2:00 PM |
| Thursday, July 24 | Agege (Pen Cinema) | 9:00 AM – 2:00 PM |
| Friday, July 25 | Oshodi (Bolade) | 9:00 AM – 2:00 PM |
| Saturday, July 26 | All Locations | 9:00 AM – 4:00 PM (Food Distribution) |

---

## How You Can Be Involved

### Volunteer
We need 200 volunteers across all five days. Roles include:
- **Evangelism team members** (training provided)
- **Medical professionals** (doctors, nurses, pharmacists)
- **Children's ministry workers**
- **Logistics and coordination**
- **Media and documentation**

If you are an approved Franchise Church member, you can sign up through the member portal. Volunteer briefing sessions will be held on **Sunday, July 6** and **Sunday, July 13** after the main service.

### Give
This mission will cost approximately ₦4.5 million to execute fully. We are believing God to cover every naira through the generosity of our church family and partners.

You can give specifically towards the Lagos Mainland Mission through our giving page — select **"Outreach Mission"** from the fund dropdown.

### Pray
The most critical support you can give is prayer. We are asking every member to commit to praying for the mission daily from July 1–26 using our prayer guide, which will be available for download from the member portal.

---

## A Word from the Pastoral Team

> *"The church that only gathers is only half a church. We gather so that we can be sent — full, equipped, and on fire. Lagos needs to hear the gospel, and Franchise Church has been positioned in this city for exactly this moment. Come with us. Let's go to our Jerusalem together."*

We believe this mission will be the most fruitful outreach in our church's history. The harvest is truly plentiful.

---

**For more information**, contact the church office at info@thefranchiselagos.com.ng or speak with any member of our outreach team after Sunday service.

*Franchise Church. For Lagos. For Nigeria. For the Nations.*`,
  },
];

export async function seedSamplePosts() {
  await requireAdmin();

  await db.insert(blogPosts).values(SAMPLE_POSTS).onConflictDoNothing();

  revalidatePath("/blog");
  revalidatePath("/admin/blog");

  return { ok: true, count: SAMPLE_POSTS.length };
}
