import type { MatchResult } from "./types";

const WIDTH = 700;
const HEIGHT = 600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const heartPath = new Path2D(
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  );
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.8;
  ctx.stroke(heartPath);
  ctx.restore();
}

export async function renderMatchCard(
  nameA: string,
  nameB: string,
  result: MatchResult,
  photoA?: string | null,
  photoB?: string | null,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);

  const centerX = WIDTH / 2;
  const photoSize = 96;
  const gap = 60;
  const half = photoSize + gap;

  const hasA = !!(photoA && (await loadImage(photoA).catch(() => null)));
  const hasB = !!(photoB && (await loadImage(photoB).catch(() => null)));

  const imgA = hasA ? await loadImage(photoA!) : null;
  const imgB = hasB ? await loadImage(photoB!) : null;

  let leftX = centerX - photoSize / 2;
  let rightX = centerX - photoSize / 2;
  if (hasA && hasB) {
    leftX = centerX - half;
    rightX = centerX + gap;
  } else if (hasA) {
    leftX = centerX - photoSize / 2;
  } else if (hasB) {
    rightX = centerX - photoSize / 2;
  }

  const photoY = 60;

  if (imgA) {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX, photoY, photoSize, photoSize);
    ctx.drawImage(imgA, leftX, photoY, photoSize, photoSize);
  }
  if (imgB) {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX, photoY, photoSize, photoSize);
    ctx.drawImage(imgB, rightX, photoY, photoSize, photoSize);
  }

  const nameY = photoY + photoSize + 14;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (hasA && hasB) {
    ctx.fillText(nameA.toUpperCase(), leftX + photoSize / 2, nameY);
    ctx.fillText(nameB.toUpperCase(), rightX + photoSize / 2, nameY);
  } else if (hasA) {
    ctx.fillText(nameA.toUpperCase(), centerX, nameY);
    ctx.fillText(nameB.toUpperCase(), centerX, nameY + 28);
  } else if (hasB) {
    ctx.fillText(nameA.toUpperCase(), centerX, nameY);
    ctx.fillText(nameB.toUpperCase(), centerX, nameY + 28);
  } else {
    ctx.fillText(nameA.toUpperCase(), centerX, nameY);
    ctx.fillText(nameB.toUpperCase(), centerX, nameY + 28);
  }

  // separator
  if (hasA && hasB) {
    const sepY = photoY + photoSize / 2;
    if (result.mode === "romance") {
      drawHeart(ctx, centerX, sepY, 28);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "28px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u2726", centerX, sepY);
    }
  }

  // score area offset
  let scoreOffsetY = nameY + 50;
  if (!hasA && !hasB) {
    scoreOffsetY = nameY + 60;
  }

  const scoreY = scoreOffsetY;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "14px monospace";
  ctx.textBaseline = "bottom";
  ctx.fillText("MATCH", centerX, scoreY);

  const scoreSize = result.score >= 90 ? 96 : 80;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `bold ${scoreSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.fillText(`${result.score}%`, centerX, scoreY + 6);

  const tagY = scoreY + scoreSize + 24;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px monospace";
  ctx.textBaseline = "top";
  ctx.fillText(result.tagline.toUpperCase(), centerX, tagY);

  const barY = tagY + 44;
  const barMaxWidth = 400;
  const barLeft = (WIDTH - barMaxWidth) / 2;
  const barH = 18;
  const barGap = 30;

  ctx.textBaseline = "middle";
  result.subScores.forEach((s, i) => {
    const y = barY + i * barGap;

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(s.label.toUpperCase(), barLeft, y);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(barLeft, y + 10, barMaxWidth, barH - 10);

    const fillW = (s.value / 100) * barMaxWidth;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(barLeft, y + 10, fillW, barH - 10);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${s.value}%`, WIDTH - barLeft, y);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas toBlob failed"));
    }, "image/png");
  });
}
