import { VisualizerOptions, VisualizerResult, getColorFn, applyBackground } from ".";

export function renderWaveform(
  buffer: AudioBuffer,
  opts: VisualizerOptions,
  timeStart?: number,
  timeEnd?: number,
): VisualizerResult {
  const totalSamples = buffer.length;
  const sampleRate = buffer.sampleRate;
  const startSample = timeStart != null ? Math.floor(timeStart * sampleRate) : 0;
  const endSample = timeEnd != null ? Math.floor(timeEnd * sampleRate) : totalSamples;
  const range = endSample - startSample;
  const data = buffer.getChannelData(0);

  return {
    render(ctx: CanvasRenderingContext2D) {
      const { width, height, colors, background } = opts;
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      applyBackground(ctx, background);

      const midY = height / 2;
      const step = Math.max(1, Math.floor(range / width));
      const ampScale = height * 0.45;
      const isGradient = colors.length > 1;

      const amps: number[] = [];
      let globalMaxAmp = 0;
      for (let x = 0; x < width; x++) {
        const idx = startSample + x * step;
        let maxVal = 0;
        const end = Math.min(idx + step, endSample);
        for (let i = idx; i < end; i++) {
          const abs = Math.abs(data[i] ?? 0);
          if (abs > maxVal) maxVal = abs;
        }
        amps.push(maxVal);
        if (maxVal > globalMaxAmp) globalMaxAmp = maxVal;
      }
      if (globalMaxAmp === 0) globalMaxAmp = 1;

      if (isGradient) {
        ctx.lineWidth = 1.5;
        for (let i = 0; i < width - 1; i++) {
          const amp = amps[i] / globalMaxAmp;
          const y = midY - amps[i] * ampScale;
          const y2 = midY - amps[i + 1] * ampScale;
          ctx.beginPath();
          ctx.moveTo(i, y);
          ctx.lineTo(i + 1, y2);
          ctx.strokeStyle = getColorFn(colors, amp);
          ctx.stroke();
        }
        for (let i = 0; i < width - 1; i++) {
          const amp = amps[i] / globalMaxAmp;
          const y = midY + amps[i] * ampScale;
          const y2 = midY + amps[i + 1] * ampScale;
          ctx.beginPath();
          ctx.moveTo(i, y);
          ctx.lineTo(i + 1, y2);
          ctx.strokeStyle = getColorFn(colors, amp);
          ctx.stroke();
        }
      } else {
        const color = colors[0] ?? "#ffffff";
        ctx.beginPath();
        ctx.moveTo(0, midY - amps[0] * ampScale);
        for (let i = 1; i < width; i++) ctx.lineTo(i, midY - amps[i] * ampScale);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, midY + amps[0] * ampScale);
        for (let i = 1; i < width; i++) ctx.lineTo(i, midY + amps[i] * ampScale);
        ctx.stroke();
      }

      if (isGradient) {
        let prevAmp = 0;
        for (let x = 0; x < width; x += 2) {
          const idx = startSample + x * step;
          const val = Math.abs(data[idx] ?? 0);
          const amp = val / globalMaxAmp;
          const diff = Math.abs(amp - prevAmp);
          if (diff > 0.01) {
            const alpha = Math.min(1, diff * 4);
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = getColorFn(colors, amp);
            ctx.fillRect(x, midY - 1, 2, 2);
            ctx.globalAlpha = 1;
          }
          prevAmp = amp;
        }
      }
    },
  };
}