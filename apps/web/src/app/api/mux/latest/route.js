import Mux from "@mux/mux-node";

const mux = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);

export async function GET() {
  try {
    const assets = await mux.video.assets.list({ limit: 1 });
    const latest = assets.data[0];

    if (!latest?.playback_ids?.length) {
      return new Response(JSON.stringify({ error: "No video found" }), {
        status: 404,
      });
    }

    const playbackId = latest.playback_ids[0].id;
    const videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    return new Response(JSON.stringify({ url: videoUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ API error:", err);
    return new Response(JSON.stringify({ error: "Failed to load video" }), {
      status: 500,
    });
  }
}
