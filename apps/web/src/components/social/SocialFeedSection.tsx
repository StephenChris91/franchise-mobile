"use client";

import { useState } from "react";
import PostComposer from "./PostComposer";
import FeedClient, { type PostWithMeta } from "./FeedClient";
import type { SocialPost } from "../../../db/schema";

interface Props {
  initialPosts: PostWithMeta[];
  currentUserId: string;
  currentUserRole?: string;
  currentUserName: string;
  currentUserPhoto?: string | null;
  currentUserUsername: string;
  groupId?: string | null;
  postType?: string;
  loadMoreAction: (cursor: string) => Promise<PostWithMeta[]>;
}

export default function SocialFeedSection({
  initialPosts,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhoto,
  currentUserUsername,
  groupId,
  postType,
  loadMoreAction,
}: Props) {
  const [myPosts, setMyPosts] = useState<PostWithMeta[]>([]);

  function handlePostedWithData(post: SocialPost) {
    const newEntry: PostWithMeta = {
      post,
      author: {
        name: currentUserName,
        username: currentUserUsername,
        photoUrl: currentUserPhoto ?? null,
      },
      group: null,
      reactionCounts: { like: 0, amen: 0, praying: 0, heart: 0 },
      userReactions: [],
    };
    setMyPosts((prev) => [newEntry, ...prev]);
  }

  return (
    <>
      <div className="mb-4">
        <PostComposer
          groupId={groupId}
          authorName={currentUserName}
          authorPhoto={currentUserPhoto}
          onPostedWithData={handlePostedWithData}
        />
      </div>

      <FeedClient
        initialPosts={initialPosts}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserName={currentUserName}
        currentUserPhoto={currentUserPhoto}
        groupId={groupId}
        postType={postType}
        loadMoreAction={loadMoreAction}
        myPosts={myPosts}
      />
    </>
  );
}
