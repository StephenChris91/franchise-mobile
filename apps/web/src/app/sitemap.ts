import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://thefranchiselagos.com.ng";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/pages/about-us`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/pages/sermons`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${APP_URL}/pages/give`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/pages/counselling`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${APP_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/blog/category/sermon`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/blog/category/teaching`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/blog/category/devotional`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/blog/category/announcement`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${APP_URL}/blog/category/testimony`, changeFrequency: "weekly", priority: 0.6 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPosts();
    blogRoutes = posts.map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: post.featured ? 0.9 : 0.8,
    }));
  } catch {
    // DB unavailable at build time — skip dynamic blog routes
  }

  return [...staticRoutes, ...blogRoutes];
}
