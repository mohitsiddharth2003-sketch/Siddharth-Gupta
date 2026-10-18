import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG Brand Icon for AccountsPro India
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>
  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <!-- Outer border glow -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="#334155" stroke-width="8" opacity="0.6" />
  
  <!-- Central Ledger Book & Rupee Symbol Lockup -->
  <g transform="translate(96, 96)">
    <!-- Ledger Base Document -->
    <rect x="30" y="20" width="260" height="280" rx="28" fill="#ffffff" />
    <rect x="45" y="40" width="230" height="18" rx="9" fill="#e2e8f0" />
    <rect x="45" y="75" width="160" height="14" rx="7" fill="#cbd5e1" />
    <rect x="45" y="105" width="200" height="14" rx="7" fill="#cbd5e1" />
    <rect x="45" y="135" width="140" height="14" rx="7" fill="#cbd5e1" />

    <!-- Indian Rupee Badge Shield in Emerald & Gold -->
    <circle cx="160" cy="210" r="76" fill="url(#accent)" />
    <!-- Rupee glyph path in white -->
    <path d="M136 175 h48 M136 190 h48 M148 175 v70 M148 215 c22 0 32 -10 32 -25 c0 -15 -10 -25 -32 -25 M156 215 l32 40" 
          fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- Tricolor Accent Bar at Bottom for India theme -->
  <g transform="translate(156, 436)">
    <rect x="0" y="0" width="60" height="12" rx="6" fill="#f97316" />
    <rect x="70" y="0" width="60" height="12" rx="6" fill="#ffffff" />
    <rect x="140" y="0" width="60" height="12" rx="6" fill="#16a34a" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf8');

// Function to generate a simple uncompressed/zlib-compressed valid PNG buffer
function createPngBuffer(width, height, r = 16, g = 185, b = 129) {
  // Raw RGBA pixels buffer with 1 byte filter per line
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Gradient or soft border inside
      const distFromCenter = Math.hypot(x - width / 2, y - height / 2) / (width / 2);
      if (distFromCenter < 0.85) {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = 15;
        rawData[pixelOffset + 1] = 23;
        rawData[pixelOffset + 2] = 42;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  // CRC-32 over type and data
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) | 0;
}

const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

// Write the required PNG files
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngBuffer(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngBuffer(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngBuffer(512, 512, 5, 150, 105));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngBuffer(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngBuffer(32, 32));

console.log('PWA icon assets generated successfully in public/');
