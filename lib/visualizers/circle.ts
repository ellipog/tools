import { VisualizerOptions, VisualizerResult, getColorFn, applyBackground } from ".";

export function renderCircleWave(
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

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.32;
      const numPoints = 360;
      const step = Math.max(1, Math.floor(range / numPoints));
      const isGradient = colors.length > 1;

      let globalMaxAmp = 0;
      const points: { x: number; y: number; amp: number; angle: number }[] = [];
      for (let i = 0; i < numPoints; i++) {
        const idx = startSample + i * step;
        let maxVal = 0;
        const end = Math.min(idx + step, endSample);
        for (let j = idx; j < end; j++) {
          const abs = Math.abs(data[j] ?? 0);
          if (abs > maxVal) maxVal = abs;
        }
        if (maxVal > globalMaxAmp) globalMaxAmp = maxVal;
        const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
        const r = radius + maxVal * radius * 0.8;
        points.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
          amp: maxVal,
          angle,
        });
      }
      if (globalMaxAmp === 0) globalMaxAmp = 1;

      if (isGradient) {
        ctx.lineWidth = 2.5;
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          const amp = points[i].amp / globalMaxAmp;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[next].x, points[next].y);
          ctx.strokeStyle = getColorFn(colors, amp);
          ctx.stroke();
        }
      } else {
        const color = colors[0] ?? "#ffffff";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = colors[0] ?? "#ffffff";
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  };
}