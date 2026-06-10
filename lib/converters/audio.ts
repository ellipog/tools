// @ts-expect-error - no types available
import audioBufferToWav from "audiobuffer-to-wav";
// @ts-expect-error - no types available
import lamejs from "lamejs/lame.all.js";

export const AUDIO_SOURCE_FORMATS = ["wav", "mp3", "flac", "aac", "ogg", "opus", "m4a"] as const;
export const AUDIO_TARGET_FORMATS = ["wav", "mp3"] as const;
export type AudioSourceFormat = (typeof AUDIO_SOURCE_FORMATS)[number];
export type AudioTargetFormat = (typeof AUDIO_TARGET_FORMATS)[number];

export interface AudioOptions {
  bitrate?: number;
}

export interface AudioInfo {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

const MIME_MAP: Record<AudioTargetFormat, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
};

export async function getAudioInfo(file: File): Promise<AudioInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  audioCtx.close();
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    format: file.name.split(".").pop()?.toLowerCase() || "unknown",
    size: file.size,
  };
}

export async function convertAudio(
  file: File,
  targetFormat: AudioTargetFormat,
  options?: AudioOptions,
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  audioCtx.close();

  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const bitrate = options?.bitrate ?? 192;

  let blob: Blob;

  switch (targetFormat) {
    case "wav": {
      const wavData = audioBufferToWav(audioBuffer) as ArrayBuffer;
      blob = new Blob([wavData], { type: MIME_MAP.wav });
      break;
    }
    case "mp3": {
      const left = audioBuffer.getChannelData(0);
      const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
      const encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
      const mp3Data: Int8Array[] = [];
      const sampleBlockSize = 1152;
      for (let i = 0; i < left.length; i += sampleBlockSize) {
        const leftChunk = left.subarray(i, i + sampleBlockSize);
        const rightChunk = right.subarray(i, i + sampleBlockSize);
        const mp3Buf = encoder.encodeBuffer(
          convertFloat32ToInt16(leftChunk),
          convertFloat32ToInt16(rightChunk),
        );
        if (mp3Buf.length > 0) mp3Data.push(mp3Buf);
      }
      const flushed = encoder.flush();
      if (flushed.length > 0) mp3Data.push(flushed);
      const mp3Total = new Uint8Array(mp3Data.reduce((acc, b) => acc + b.length, 0));
      let offset = 0;
      for (const buf of mp3Data) {
        mp3Total.set(new Uint8Array(buf), offset);
        offset += buf.length;
      }
      blob = new Blob([mp3Total], { type: MIME_MAP.mp3 });
      break;
    }
  }

  return blob;
}

function convertFloat32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}
