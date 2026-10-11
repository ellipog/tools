// GPU (WebGL2) video filter pipeline for the photo booth.
//
// Why this exists: the previous pipeline did drawImage → getImageData
// (a full GPU→CPU readback stall) → per-pixel JS loops → putImageData,
// per cell, per frame. At 1280×720 that is ~1M pixels × up to dozens of
// operations (oil: 7×7 taps + per-pixel allocations, glow: 9×9 taps) on
// the main thread — single-digit fps on most machines.
//
// The GPU path uploads the video frame to a texture ONCE per frame, runs
// all filters as fragment shaders (massively parallel), then blits to each
// visible cell canvas with drawImage (GPU→GPU, no readback). One shared
// WebGL context total, no matter how many grid cells are visible.
//
// Filter index contract: pass the same `id` strings as FILTERS in
// app/(pages)/images/photo-booth/page.tsx. Unknown ids render unfiltered.

export type GlFilterOpts = {
  /** mosaic block size in px (pixelate) */
  pixel?: number;
  /** seconds, for animated filters (wave/vhs/glitch) */
  time?: number;
  /** random per-frame seed (glitch strips) */
  seed?: number;
};

export type FilterRenderer = {
  /** the hidden canvas filters are rendered into — drawImage() from it */
  canvas: HTMLCanvasElement;
  render(
    source: TexImageSource,
    width: number,
    height: number,
    filterId: string,
    opts?: GlFilterOpts,
  ): void;
  dispose(): void;
};

const FILTER_INDEX: Record<string, number> = {
  normal: 0,
  vintage: 1,
  grayscale: 2,
  invert: 3,
  comic: 4,
  thermal: 5,
  glitch: 6,
  pixelate: 7,
  xray: 8,
  emboss: 9,
  neon: 10,
  mirror: 11,
  oil: 12,
  kaleidoscope: 13,
  wave: 14,
  duotone: 15,
  vhs: 16,
  glow: 17,
  cartoon: 18,
  rainbow: 19,
};

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, a_pos.y * 0.5 + 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform int u_filter;
uniform float u_time;
uniform float u_pixel;
uniform float u_seed;

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 S(vec2 uv) { return texture2D(u_tex, uv).rgb; }

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float sobelMag(vec2 uv, vec2 tx) {
  float tl = lum(S(uv + vec2(-tx.x, -tx.y)));
  float tc = lum(S(uv + vec2(0.0, -tx.y)));
  float tr = lum(S(uv + vec2(tx.x, -tx.y)));
  float ml = lum(S(uv + vec2(-tx.x, 0.0)));
  float mr = lum(S(uv + vec2(tx.x, 0.0)));
  float bl = lum(S(uv + vec2(-tx.x, tx.y)));
  float bc = lum(S(uv + vec2(0.0, tx.y)));
  float br = lum(S(uv + vec2(tx.x, tx.y)));
  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
  return clamp(sqrt(gx * gx + gy * gy), 0.0, 1.0);
}

void quadAccum(vec2 uv, vec2 tx, vec2 qs, inout vec3 sum, inout vec3 sq, inout float n) {
  for (int j = 0; j <= 2; j++) {
    for (int i = 0; i <= 2; i++) {
      vec3 c = S(uv + vec2(float(i) * qs.x, float(j) * qs.y) * tx);
      sum += c;
      sq += c * c;
      n += 1.0;
    }
  }
}

vec3 kuwahara(vec2 uv, vec2 tx) {
  vec3 best = S(uv);
  float bestVar = 1e10;
  vec3 sum; vec3 sq; float n;
  sum = vec3(0.0); sq = vec3(0.0); n = 0.0;
  quadAccum(uv, tx, vec2(1.0, 1.0), sum, sq, n);
  vec3 mean = sum / n;
  float v = dot(abs(sq / n - mean * mean), vec3(1.0));
  best = mean; bestVar = v;
  sum = vec3(0.0); sq = vec3(0.0); n = 0.0;
  quadAccum(uv, tx, vec2(-1.0, 1.0), sum, sq, n);
  mean = sum / n;
  v = dot(abs(sq / n - mean * mean), vec3(1.0));
  if (v < bestVar) { best = mean; bestVar = v; }
  sum = vec3(0.0); sq = vec3(0.0); n = 0.0;
  quadAccum(uv, tx, vec2(1.0, -1.0), sum, sq, n);
  mean = sum / n;
  v = dot(abs(sq / n - mean * mean), vec3(1.0));
  if (v < bestVar) { best = mean; bestVar = v; }
  sum = vec3(0.0); sq = vec3(0.0); n = 0.0;
  quadAccum(uv, tx, vec2(-1.0, -1.0), sum, sq, n);
  mean = sum / n;
  v = dot(abs(sq / n - mean * mean), vec3(1.0));
  if (v < bestVar) { best = mean; }
  return best;
}

vec3 thermalPal(float t) {
  if (t < 0.0909) return vec3(0.0, 0.0, 0.0);
  else if (t < 0.1818) return vec3(0.078, 0.0, 0.314);
  else if (t < 0.2727) return vec3(0.0, 0.0, 1.0);
  else if (t < 0.3636) return vec3(0.0, 0.502, 1.0);
  else if (t < 0.4545) return vec3(0.0, 1.0, 1.0);
  else if (t < 0.5455) return vec3(0.0, 1.0, 0.0);
  else if (t < 0.6364) return vec3(0.502, 1.0, 0.0);
  else if (t < 0.7273) return vec3(1.0, 1.0, 0.0);
  else if (t < 0.8182) return vec3(1.0, 0.502, 0.0);
  else if (t < 0.9091) return vec3(1.0, 0.0, 0.0);
  else if (t < 0.9546) return vec3(1.0, 0.196, 0.392);
  return vec3(1.0, 0.784, 0.784);
}

void main() {
  vec2 tx = 1.0 / u_res;
  vec2 uv = v_uv;
  int f = u_filter;
  float px = max(u_pixel, 1.0);

  // ── UV remap stage (one filter active at a time) ──
  if (f == 7) {
    vec2 g = floor(uv * u_res / px);
    uv = (g + 0.5) * px / u_res;
  } else if (f == 11) {
    uv.x = 1.0 - uv.x;
  } else if (f == 13) {
    vec2 p = (uv - 0.5) * u_res;
    float r = length(p);
    float a = atan(p.y, p.x);
    float seg = 6.2831853 / 8.0;
    a = mod(a, seg);
    if (a < 0.0) a += seg;
    if (a > seg * 0.5) a = seg - a;
    uv = clamp(0.5 + (r * vec2(cos(a), sin(a))) / u_res, vec2(0.001), vec2(0.999));
  } else if (f == 14) {
    uv.x = fract(uv.x + sin(uv.y * u_res.y * 0.05 + u_time * 6.0) * 8.0 / u_res.x);
  } else if (f == 6) {
    float rowY = floor(uv.y * u_res.y);
    float r1 = hash12(vec2(rowY, floor(u_seed)));
    float shift = step(0.965, r1)
      * (hash12(vec2(rowY, floor(u_seed) + 7.0)) - 0.5) * 60.0 / u_res.x;
    uv.x = fract(uv.x + shift);
  } else if (f == 16) {
    float band = step(0.985, fract(u_time * 0.4));
    uv.y = fract(uv.y + band * 0.025);
    float rowIdx = floor(uv.y * u_res.y);
    float sh = 0.0;
    if (mod(rowIdx, 5.0) < 1.0) sh = sin(rowIdx + u_time * 30.0) * 5.0 / u_res.x;
    uv.x = fract(uv.x + sh);
  }

  vec3 c = S(uv);

  // ── Color stage ──
  if (f == 0 || f == 7 || f == 11 || f == 13 || f == 14) {
    // uv-only filters: nothing more to do
  } else if (f == 1) {
    c = vec3(
      dot(c, vec3(0.393, 0.769, 0.189)),
      dot(c, vec3(0.349, 0.686, 0.168)),
      dot(c, vec3(0.272, 0.534, 0.131)));
    vec2 vp = (uv - 0.5) * u_res;
    float vd = length(vp) / (0.5 * length(u_res));
    c *= 1.0 - vd * vd * 0.4;
  } else if (f == 2) {
    c = vec3(lum(c));
  } else if (f == 3) {
    c = vec3(1.0) - c;
  } else if (f == 4) {
    c = floor(c * 6.0 + 0.5) / 6.0;
    if (sobelMag(uv, tx) > 0.235) c = vec3(0.0);
  } else if (f == 5) {
    c = thermalPal(lum(c));
  } else if (f == 6) {
    float so = (floor(hash1(u_seed) * 15.0) + 3.0) / u_res.x;
    c = vec3(S(uv + vec2(so, 0.0)).r, S(uv).g, S(uv + vec2(-so, 0.0)).b);
  } else if (f == 8) {
    c = clamp(vec3(lum(vec3(1.0) - c)) * 1.3, 0.0, 1.0);
  } else if (f == 9) {
    vec3 acc = vec3(0.0);
    acc += S(uv + vec2(-tx.x, -tx.y)) * -2.0;
    acc += S(uv + vec2(0.0, -tx.y)) * -1.0;
    acc += S(uv + vec2(tx.x, -tx.y)) * 0.0;
    acc += S(uv + vec2(-tx.x, 0.0)) * -1.0;
    acc += S(uv + vec2(0.0, 0.0)) * 1.0;
    acc += S(uv + vec2(tx.x, 0.0)) * 1.0;
    acc += S(uv + vec2(-tx.x, tx.y)) * 0.0;
    acc += S(uv + vec2(0.0, tx.y)) * 1.0;
    acc += S(uv + vec2(tx.x, tx.y)) * 2.0;
    c = clamp(acc + vec3(128.0 / 255.0), 0.0, 1.0);
  } else if (f == 10) {
    float e = sobelMag(uv, tx);
    if (e > 0.157) c = vec3(min(e + 0.392, 1.0), max(e - 0.196, 0.0), 1.0);
    else c *= 0.3;
  } else if (f == 12) {
    c = kuwahara(uv, tx);
  } else if (f == 15) {
    c = mix(vec3(15.0 / 255.0, 15.0 / 255.0, 80.0 / 255.0),
            vec3(1.0, 200.0 / 255.0, 50.0 / 255.0), lum(c));
  } else if (f == 16) {
    float ca = 3.0 / u_res.x;
    float r = mix(c.r, S(uv + vec2(ca, 0.0)).r, 0.5);
    float b = mix(c.b, S(uv - vec2(ca, 0.0)).b, 0.5);
    c = vec3(r, c.g, b);
  } else if (f == 17) {
    float acc = 0.0;
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        acc += max(lum(S(uv + vec2(float(i), float(j)) * tx)) - 0.588, 0.0);
      }
    }
    c = clamp(c + acc / 25.0 * 1.5, 0.0, 1.0);
  } else if (f == 18) {
    c = floor(c * 5.0 + 0.5) / 5.0;
    float e = sobelMag(uv, tx);
    if (e > 0.314) c = max(c - e * 0.5, 0.0);
  } else if (f == 19) {
    vec3 hsv = rgb2hsv(c);
    if (hsv.y > 0.001) c = hsv2rgb(vec3(fract(hsv.x + v_uv.x), hsv.y, hsv.z));
  }

  gl_FragColor = vec4(c, 1.0);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`filter shader compile failed: ${log}`);
  }
  return sh;
}

export function createFilterRenderer(): FilterRenderer | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`filter program link failed: ${gl.getProgramInfoLog(program)}`);
    }
  } catch {
    return null;
  }
  gl.useProgram(program);

  // Fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // Single texture, updated in place every frame
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.uniform1i(gl.getUniformLocation(program, "u_tex"), 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uFilter = gl.getUniformLocation(program, "u_filter");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uPixel = gl.getUniformLocation(program, "u_pixel");
  const uSeed = gl.getUniformLocation(program, "u_seed");

  return {
    canvas,
    render(source, width, height, filterId, opts) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform2f(uRes, width, height);
      gl.uniform1i(uFilter, FILTER_INDEX[filterId] ?? 0);
      gl.uniform1f(uTime, opts?.time ?? 0);
      gl.uniform1f(uPixel, opts?.pixel ?? 8);
      gl.uniform1f(uSeed, opts?.seed ?? 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    },
  };
}
