import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "../../../../../auth";
import {
  getGroupBySlug,
  getGroupFeed,
  isGroupMember,
  getUserGroups,
  getGroupMembers,
} from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";
import PostComposer from "@/components/social/PostComposer";
import FeedClient from "@/components/social/FeedClient";
import GroupsClient from "@/components/social/GroupsClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return { title: "Group not found" };
  return { title: `${group.name} — Franchise Community` };
}

export default async function GroupPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/login?callbackUrl=/social/groups/${slug}`);
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [group, joinedGroups] = await Promise.all([
    getGroupBySlug(slug),
    getUserGroups(session.user.id),
  ]);

  if (!group) notFound();

  const [isMember, initialPosts, members] = await Promise.all([
    isGroupMember(group.id, session.user.id),
    getGroupFeed(group.id, session.user.id),
    getGroupMembers(group.id),
  ]);

  async function loadMorePosts(cursor: string) {
    "use server";
    return getGroupFeed(group!.id, session!.user!.id!, cursor);
  }

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      {/* Cover */}
      <div
        className="h-40 rounded-2xl bg-gradient-to-br from-[#af601a] to-[#e8913a] mb-4 flex items-end p-5"
        style={
          group.coverImageUrl
            ? { backgroundImage: `url(${group.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}
        }
      >
        <div className="bg-black/50 rounded-xl px-4 py-2 backdrop-blur-sm">
          <h1 className="text-lg font-bold text-white">{group.name}</h1>
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <Users size={12} />
            <span>{group.memberCount} members</span>
          </div>
        </div>
      </div>

      {/* Join/leave handled by GroupsClient reused as single card */}
      {!isMember && (
        <div className="mb-4">
          <GroupsClient
            groups={[group]}
            joinedIds={[]}
            currentUserId={session.user.id}
          />
        </div>
      )}

      <Tabs defaultValue="posts">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {isMember && (
            <div className="mb-4">
              <PostComposer
                groupId={group.id}
                authorName={session.user.name ?? "Member"}
                authorPhoto={session.user.image}
              />
            </div>
          )}
          <FeedClient
            initialPosts={initialPosts}
            currentUserId={session.user.id}
            currentUserRole={session.user.role}
            groupId={group.id}
            loadMoreAction={loadMorePosts}
          />
        </TabsContent>

        <TabsContent value="members">
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            {members.map((m) => (
              <a
                key={m.userId}
                href={`/social/members/${m.profile.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
              >
                {m.profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.profile.photoUrl} alt={m.profile.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-sm font-bold text-white">
                    {m.profile.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.profile.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                </div>
              </a>
            ))}
            {members.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No members yet. Be the first to join!</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="about">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">About {group.name}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{group.description || "No description provided."}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize mt-0.5">
                  {group.groupType.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Visibility</p>
                <p className="text-sm font-medium text-gray-900 capitalize mt-0.5">{group.visibility}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Members</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{group.memberCount}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </SocialLayout>
  );
}
