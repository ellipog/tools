import { NextResponse } from "next/server";
import { join } from "path";
import youtubeDl from "youtube-dl-exec";

const ytDl = youtubeDl.create(
  join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp.exe"),
);

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const info: any = await ytDl(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    });

    const formats = (info.formats || [])
      .filter((f: any) => f.url)
      .map((f: any) => ({
        id: f.format_id,
        ext: f.ext,
        height: f.height || null,
        width: f.width || null,
        note: f.format_note || null,
        vcodec: f.vcodec !== "none",
        acodec: f.acodec !== "none",
        filesize: f.filesize || f.filesize_approx || null,
      }));

    return NextResponse.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      channel: info.channel,
      uploadDate: info.upload_date,
      viewCount: info.view_count,
      likeCount: info.like_count,
      formats,
    });
  } catch (err: any) {
    console.error("youtube-dl info error:", err.message);
    return NextResponse.json({ error: err.stderr || err.message }, { status: 500 });
  }
}