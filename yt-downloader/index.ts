import youtubeDl from "youtube-dl-exec";
import { join } from "path";
import { cwd } from "process";

const url = Bun.argv[2];
if (!url) {
  console.error("Usage: bun run index.ts <youtube-url> [--audio-only]");
  process.exit(1);
}

const audioOnly = Bun.argv.includes("--audio-only") || Bun.argv.includes("-a");

console.log(`Fetching video info...`);
const info = await youtubeDl(url, {
  dumpJson: true,
  noCheckCertificates: true,
  noWarnings: true,
});

const title = (info as any).title.replace(/[<>:"/\\|?*]/g, "_");

console.log(`Downloading: ${(info as any).title}`);

const ext = audioOnly ? "m4a" : "mp4";
const outPath = join(cwd(), `${title}.${ext}`);

await youtubeDl(url, {
  output: outPath,
  format: audioOnly ? "bestaudio[ext=m4a]/bestaudio" : "best[ext=mp4]/best",
  noCheckCertificates: true,
  noWarnings: true,
});

console.log(`Downloaded: ${outPath}`);