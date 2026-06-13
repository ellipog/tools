import { NextResponse } from "next/server";
import { join } from "path";
import youtubeDl from "youtube-dl-exec";

const ytDl = youtubeDl.create(
  join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp.exe"),
);

export async function POST(request: Request) {
  try {
    const { url, format_id } = await request.json();
    if (!url || !format_id) {
      return NextResponse.json({ error: "URL and format_id required" }, { status: 400 });
    }

    const proc = ytDl.exec(url, {
      output: "-",
      format: format_id,
      noCheckCertificates: true,
      noWarnings: true,
    });

    const body = new ReadableStream({
      start(controller) {
        proc.stdout?.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        proc.stdout?.on("end", () => {
          controller.close();
        });
        proc.stdout?.on("error", (err: Error) => {
          controller.error(err);
        });
      },
    });

    const ext = format_id.startsWith("bestaudio") ? "m4a" : "mp4";

    return new Response(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="download.${ext}"`,
        "X-Retrieved-From": "runen.no",
      },
    });
  } catch (err: any) {
    console.error("youtube-dl download error:", err.message);
    return NextResponse.json({ error: err.stderr || err.message }, { status: 500 });
  }
}