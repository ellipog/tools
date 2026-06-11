import { VisualizerOptions, VisualizerResult, getColorFn, applyBackground, computeFFT } from ".";

export function renderFrequencyBars(
  buffer: AudioBuffer,
  opts: VisualizerOptions,
  fftSize: number = 2048,
  barCount: number = 64,
  timeStart?: number,
  timeEnd?: number,
): VisualizerResult {
  const sampleRate = buffer.sampleRate;
  const totalSamples = buffer.length;
  const startSample = timeStart != null ? Math.floor(timeStart * sampleRate) : 0;
  const endSample = timeEnd != null ? Math.floor(timeEnd * sampleRate) : totalSamples;
  const range = endSample - startSample;
  const data = buffer.getChannelData(0);
  const midSample = startSample + Math.floor(range / 2);
  const segment = data.subarray(
    Math.max(0, midSample - fftSize / 2),
    Math.min(data.length, midSample + fftSize / 2),
  );

  const padded = new Float32Array(fftSize);
  padded.set(segment);
  const magnitudes = computeFFT(padded, fftSize);

  return {
    render(ctx: CanvasRenderingContext2D) {
      const { width, height, colors, background } = opts;
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      applyBackground(ctx, background);

      const usable = Math.min(magnitudes.length, barCount);
      const barW = width / usable;
      let maxMag = 0;
      for (let i = 1; i < usable; i++) {
        if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
      }
      if (maxMag === 0) maxMag = 1;

      const bars: { x: number; w: number; h: number; amp: number; freq: number }[] = [];
      for (let i = 0; i < usable; i++) {
        const norm = magnitudes[i] / maxMag;
        const barH = Math.max(0.5, norm * norm * height * 0.92);
        const x = i * barW;
        bars.push({ x, w: Math.max(1, barW - 1.5), h: barH, amp: norm, freq: i / usable });
      }

      for (const bar of bars) {
        const dualT = bar.amp * 0.7 + bar.freq * 0.3;
        ctx.fillStyle = getColorFn(colors, dualT);
        ctx.fillRect(bar.x, height - bar.h, bar.w, bar.h);
      }

      ctx.globalAlpha = 0.15;
      for (const bar of bars) {
        if (bar.amp > 0.3) {
          ctx.fillStyle = getColorFn(colors, Math.min(1, bar.freq + 0.15));
          ctx.fillRect(bar.x - 1, height - bar.h - 2, bar.w + 2, 4);
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}