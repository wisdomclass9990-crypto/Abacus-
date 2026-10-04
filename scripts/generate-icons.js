import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  // PNG scanlines: each line starts with filter type 0 (None)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    scanlines[p++] = 0; // Filter 0
    const rowStart = y * width * 4;
    rgba.copy(scanlines, p, rowStart, rowStart + width * 4);
    p += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(4 + 4 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(crcBuf);
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: deflate
  ihdrData[11] = 0; // Filter: standard
  ihdrData[12] = 0; // Interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw function for Abacus Icon
function drawAbacus(x, y, w, h) {
  // Normalize to 0..1
  const nx = x / w;
  const ny = y / h;

  // Background dark rounded box
  const bgR = 15, bgG = 23, bgB = 42; // #0f172a
  
  // Outer frame margin: 0.12 to 0.88
  if (nx < 0.12 || nx > 0.88 || ny < 0.16 || ny > 0.84) {
    return [bgR, bgG, bgB, 255];
  }

  // Frame border: dark amber wood
  if (nx < 0.16 || nx > 0.84 || ny < 0.20 || ny > 0.80) {
    return [120, 53, 15, 255]; // #78350f
  }

  // Inner field: slate
  let r = 30, g = 41, b = 59; // #1e293b

  // Beam in middle: ny between 0.42 and 0.48
  if (ny >= 0.43 && ny <= 0.47) {
    // Reckoning unit dots
    const isDot = (Math.abs(nx - 0.5) < 0.015 && Math.abs(ny - 0.45) < 0.015) ||
                  (Math.abs(nx - 0.35) < 0.012 && Math.abs(ny - 0.45) < 0.012) ||
                  (Math.abs(nx - 0.65) < 0.012 && Math.abs(ny - 0.45) < 0.012);
    if (isDot) return [254, 240, 138, 255];
    return [69, 26, 3, 255]; // beam wood
  }

  // 5 Rods at nx = 0.23, 0.365, 0.50, 0.635, 0.77
  const rods = [0.25, 0.375, 0.50, 0.625, 0.75];
  let onRod = false;
  for (const rx of rods) {
    if (Math.abs(nx - rx) < 0.008) {
      onRod = true;
      break;
    }
  }
  if (onRod) {
    r = 148; g = 163; b = 184; // silver rod
  }

  // Beads drawing:
  // Upper beads (ny: 0.20 to 0.43)
  // Lower beads (ny: 0.47 to 0.80)
  for (let i = 0; i < rods.length; i++) {
    const rx = rods[i];
    const dx = Math.abs(nx - rx);
    if (dx <= 0.045) {
      const isAccent = (i === 2);
      const beadColor = isAccent ? [37, 99, 235, 255] : [234, 88, 12, 255];

      // Upper bead position:
      // rod 0: up (0.24), rod 1: down (0.39), rod 2: down (0.39), rod 3: up (0.24), rod 4: down (0.39)
      const upperActive = (i === 1 || i === 2 || i === 4);
      const upperY = upperActive ? 0.38 : 0.25;
      if (Math.abs(ny - upperY) < 0.035) {
        // Bi-conical / diamond shape factor
        const dy = Math.abs(ny - upperY) / 0.035;
        if (dx / 0.045 + dy * 0.7 < 1.0) {
          return beadColor;
        }
      }

      // Lower beads: 4 beads.
      // Active beads are pushed UP towards beam (0.52, 0.58, 0.64, 0.70)
      // Inactive beads pushed DOWN towards frame
      const lowerCountActive = [2, 3, 4, 1, 0][i];
      for (let bIdx = 0; bIdx < 4; bIdx++) {
        let beadY;
        if (bIdx < lowerCountActive) {
          beadY = 0.51 + bIdx * 0.055;
        } else {
          beadY = 0.76 - (3 - bIdx) * 0.055;
        }
        if (Math.abs(ny - beadY) < 0.024) {
          const dy = Math.abs(ny - beadY) / 0.024;
          if (dx / 0.045 + dy * 0.7 < 1.0) {
            return isAccent ? [59, 130, 246, 255] : [249, 115, 22, 255];
          }
        }
      }
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate sizes
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, drawAbacus));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, drawAbacus));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, drawAbacus));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, drawAbacus));

console.log('PNG Icons successfully generated!');
