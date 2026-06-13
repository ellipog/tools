export const ATTRIBUTION = "Retrieved from runen.no";

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

export async function attributePng(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // PNG signature is 8 bytes, then IHDR chunk (4 len + 4 type + 13 data + 4 crc = 25)
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return blob;

  const keyword = "retrievedFrom";
  const text = ATTRIBUTION;
  const chunkData = new TextEncoder().encode(keyword + "\0" + text);
  const chunkLen = chunkData.length;

  const chunkType = new TextEncoder().encode("tEXt");
  const typeAndData = new Uint8Array(chunkType.length + chunkData.length);
  typeAndData.set(chunkType, 0);
  typeAndData.set(chunkData, chunkType.length);
  const crcVal = crc32(typeAndData);

  const chunk = new Uint8Array(4 + 4 + chunkLen + 4);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, chunkLen);
  chunk.set(chunkType, 4);
  chunk.set(chunkData, 8);
  dv.setUint32(8 + chunkLen, crcVal);

  // Insert after IHDR (8 byte sig + 25 byte IHDR chunk)
  const insertAt = 33;
  const result = new Uint8Array(bytes.length + chunk.length);
  result.set(bytes.subarray(0, insertAt), 0);
  result.set(chunk, insertAt);
  result.set(bytes.subarray(insertAt), insertAt + chunk.length);

  return new Blob([result], { type: "image/png" });
}

export async function attributeGif(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (bytes[0] !== 0x47 || bytes[1] !== 0x49) return blob;

  const textBytes = new TextEncoder().encode(ATTRIBUTION);
  const subBlocks: number[] = [];
  for (let i = 0; i < textBytes.length; i += 255) {
    const slice = textBytes.slice(i, i + 255);
    subBlocks.push(slice.length, ...slice);
  }
  subBlocks.push(0x00);

  const comment = new Uint8Array([0x21, 0xFE, ...subBlocks]);
  const result = new Uint8Array(bytes.length + comment.length);
  result.set(comment, 0);
  result.set(bytes, comment.length);

  return new Blob([result], { type: "image/gif" });
}

export async function attributeJpeg(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  const textBytes = new TextEncoder().encode(ATTRIBUTION);
  const segLen = 2 + textBytes.length;
  const comMarker = new Uint8Array(2 + 2 + textBytes.length);
  comMarker[0] = 0xff;
  comMarker[1] = 0xfe;
  const dv = new DataView(comMarker.buffer);
  dv.setUint16(2, segLen);
  comMarker.set(textBytes, 4);

  const result = new Uint8Array(bytes.length + comMarker.length);
  result.set(comMarker, 0);
  result.set(bytes, comMarker.length);

  return new Blob([result], { type: "image/jpeg" });
}

export function attributeText(text: string): string {
  return `// ${ATTRIBUTION}\n${text}`;
}

export async function attributeBlob(blob: Blob): Promise<Blob> {
  const type = blob.type.toLowerCase();
  if (type === "image/png") return attributePng(blob);
  if (type === "image/gif") return attributeGif(blob);
  if (type === "image/jpeg" || type === "image/jpg") return attributeJpeg(blob);
  return blob;
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const attributed = await attributeBlob(blob);
  const url = URL.createObjectURL(attributed);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
