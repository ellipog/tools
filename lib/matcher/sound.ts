export function playRevealSound(score: number): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    const baseFreq = score > 70 ? 523 : score > 40 ? 392 : 262;
    const targetFreq = score > 70 ? 784 : score > 40 ? 440 : 196;

    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(
      targetFreq,
      ctx.currentTime + 0.3,
    );
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio not available */
  }
}
