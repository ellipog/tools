import { VisualizerOptions, VisualizerResult, getColorFn, applyBackground, computeFFT } from ".";

export function renderSpectrogram(
  buffer: AudioBuffer,
  opts: VisualizerOptions,
  fftSize: number = 1024,
  timeStart?: number,
  timeEnd?: number,
): VisualizerResult {
  const sampleRate = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const totalSamples = buffer.length;
  const startSample = timeStart != null ? Math.floor(timeStart * sampleRate) : 0;
  const endSample = timeEnd != null ? Math.floor(timeEnd * sampleRate) : totalSamples;
  const range = endSample - startSample;

  const hopSize = Math.floor(fftSize / 4);
  const numFrames = Math.max(1, Math.floor((range - fftSize) / hopSize));

  const frames: { magnitudes: Float32Array }[] = [];
  for (let f = 0; f < numFrames; f++) {
    const offset = startSample + f * hopSize;
    const segment = data.subarray(offset, offset + fftSize);
    const padded = new Float32Array(fftSize);
    padded.set(segment);
    frames.push({ magnitudes: computeFFT(padded, fftSize) });
  }

  let globalMax = 0;
  for (const frame of frames) {
    for (let i = 1; i < frame.magnitudes.length; i++) {
      if (frame.magnitudes[i] > globalMax) globalMax = frame.magnitudes[i];
    }
  }
  if (globalMax === 0) globalMax = 1;

  return {
    render(ctx: CanvasRenderingContext2D) {
      const { width, height, colors, background } = opts;
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      applyBackground(ctx, background);

      const freqBins = fftSize / 2;
      const colW = width / frames.length;
      const rowH = height / freqBins;

      for (let f = 0; f < frames.length; f++) {
        for (let b = 0; b < freqBins; b++) {
          const norm = frames[f].magnitudes[b] / globalMax;
          const logAmp = Math.log10(1 + norm * 9) / Math.log10(10);
          const contoured = Math.round(logAmp * 12) / 12;
          ctx.fillStyle = getColorFn(colors, contoured);
          ctx.fillRect(f * colW, (freqBins - 1 - b) * rowH, Math.ceil(colW) + 0.5, Math.ceil(rowH) + 0.5);
        }
      }
    },
  };
}