import { createClient } from "@supabase/supabase-js";

export async function GET() {
  // Lazy-initialize so missing env vars don't crash at build time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    const { data: sermons, error } = await supabase
      .from("sermons")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify([]), { status: 500 });
    }

    const signedSermons = await Promise.all(
      (sermons || []).map(async (sermon) => {
        const audioRes = sermon.audio_url
          ? await supabase.storage
              .from("sermons-audio")
              .createSignedUrl(sermon.audio_url, 60 * 60)
          : null;

        let thumbnailRes = null;
        if (sermon.thumbnail && !sermon.thumbnail.startsWith("http")) {
          thumbnailRes = await supabase.storage
            .from("sermons-thumbnail")
            .createSignedUrl(sermon.thumbnail, 60 * 60);
        }

        return {
          ...sermon,
          audioUrl: audioRes?.data?.signedUrl || null,
          thumbnail:
            thumbnailRes?.data?.signedUrl ||
            sermon.thumbnail ||
            "/assets/sermon-fallback.jpg",
        };
      })
    );

    return new Response(JSON.stringify(signedSermons), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify([]), { status: 500 });
  }
}
