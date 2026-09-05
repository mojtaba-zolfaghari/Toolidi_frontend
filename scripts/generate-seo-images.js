/**
 * One-off generator for the static brand images used by SeoService defaults:
 *   src/assets/og-default.png  (1200x630, Open Graph default image)
 *   src/assets/logo.png        (512x512, Organization JSON-LD logo)
 *
 * Pure Node (no deps): writes a truecolor RGBA PNG (no scanline filtering)
 * with a purple brand gradient, the Toolidi "T" logomark, a soft radial
 * glow, and (for the OG image) a pixel-font "TOOLIDI" wordmark.
 *
 * Run: node scripts/generate-seo-images.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W_OG = 1200, H_OG = 630;
const W_LOGO = 512, H_LOGO = 512;

// Brand colors (index.html theme-color is #6C3FC5)
const C1 = [0x6c, 0x3f, 0xc5]; // primary purple
const C2 = [0x2b, 0x1a, 0x54]; // darker violet for the gradient

const lerp = (a, b, t) => a + (b - a) * t;

// ── Pixel-font wordmark (5x7) ──────────────────────────
const FONT = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
};

// ── Rendering ──────────────────────────────────────────

/** Base layer: diagonal purple gradient + soft radial glow + optional rounded-corner alpha mask */
function render(w, h, isLogo) {
  const buf = Buffer.alloc(w * h * 4);
  const gx = w * 0.8, gy = h * 0.15;
  const glowR = Math.max(w, h) * 0.65;
  const rad = Math.round(Math.min(w, h) * 0.22);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (x / w + y / h) / 2;
      let r = lerp(C1[0], C2[0], t);
      let g = lerp(C1[1], C2[1], t);
      let b = lerp(C1[2], C2[2], t);

      const d = Math.hypot(x - gx, y - gy);
      const glow = d < glowR ? 1 - d / glowR : 0;
      r = Math.min(255, r + 60 * glow * 0.35);
      g = Math.min(255, g + 40 * glow * 0.35);
      b = Math.min(255, b + 80 * glow * 0.35);

      let a = 255;
      if (isLogo) {
        // Rounded-corner transparency mask (all four corners)
        const dx = Math.min(x, w - 1 - x);
        const dy = Math.min(y, h - 1 - y);
        if (dx < rad && dy < rad && Math.hypot(rad - dx, rad - dy) > rad) a = 0;
      }

      const i = (y * w + x) * 4;
      buf[i] = Math.round(r); buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b); buf[i + 3] = a;
    }
  }
  return buf;
}

/** Blend a white rectangle with the given alpha */
function paintRect(buf, w, h, x0, y0, rw, rh, alpha) {
  for (let y = Math.max(0, y0); y < Math.min(h, y0 + rh); y++) {
    for (let x = Math.max(0, x0); x < Math.min(w, x0 + rw); x++) {
      const i = (y * w + x) * 4;
      buf[i] = Math.round(lerp(buf[i], 255, alpha));
      buf[i + 1] = Math.round(lerp(buf[i + 1], 255, alpha));
      buf[i + 2] = Math.round(lerp(buf[i + 2], 255, alpha));
    }
  }
}

/** The Toolidi logomark: a bold "T" built from two bars */
function drawLogoMark(buf, w, h, { cx, topY, barW, barH, topW, alpha }) {
  paintRect(buf, w, h, cx - Math.round(topW / 2), topY, topW, barW, alpha); // top bar
  paintRect(buf, w, h, cx - Math.round(barW / 2), topY, barW, barH, alpha); // stem
}

/** Pixel-font text renderer (white with alpha) */
function drawText(buf, w, h, text, x0, y0, scale, alpha) {
  let x = x0;
  for (const ch of text) {
    const rows = FONT[ch];
    if (rows) {
      for (let ry = 0; ry < 7; ry++) {
        for (let rx = 0; rx < 5; rx++) {
          if (rows[ry][rx] === '1') {
            paintRect(buf, w, h, x + rx * scale, y0 + ry * scale, scale, scale, alpha);
          }
        }
      }
    }
    x += 6 * scale; // 5px glyph + 1px spacing
  }
}

// ── PNG encoding ───────────────────────────────────────

function crc32(buf) {
  if (!crc32.table) {
    crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crc32.table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(rgba, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Main ───────────────────────────────────────────────

function main() {
  const outDir = path.join(__dirname, '..', 'src', 'assets');
  fs.mkdirSync(outDir, { recursive: true });

  // OG image: gradient + logomark right of center + wordmark bottom-left
  const og = render(W_OG, H_OG, false);
  drawLogoMark(og, W_OG, H_OG, {
    cx: Math.round(W_OG * 0.72),
    topY: Math.round(H_OG * 0.20),
    barW: Math.round(W_OG * 0.028),
    barH: Math.round(H_OG * 0.42),
    topW: Math.round(W_OG * 0.16),
    alpha: 0.9,
  });
  drawText(og, W_OG, H_OG, 'TOOLIDI', 96, H_OG - 96 - 7 * 9, 9, 0.95);
  fs.writeFileSync(path.join(outDir, 'og-default.png'), encodePng(og, W_OG, H_OG));

  // Logo: centered logomark on rounded square
  const logo = render(W_LOGO, H_LOGO, true);
  drawLogoMark(logo, W_LOGO, H_LOGO, {
    cx: Math.round(W_LOGO / 2),
    topY: Math.round(H_LOGO * 0.20),
    barW: Math.round(W_LOGO * 0.055),
    barH: Math.round(H_LOGO * 0.60),
    topW: Math.round(W_LOGO * 0.34),
    alpha: 0.95,
  });
  fs.writeFileSync(path.join(outDir, 'logo.png'), encodePng(logo, W_LOGO, H_LOGO));

  console.log('Wrote og-default.png (1200x630) and logo.png (512x512) to', outDir);
}

main();
