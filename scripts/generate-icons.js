const fs = require('fs');
const path = require('path');

// Simple PNG generator for placeholder icons
// Creates basic grayscale icons with "T" letter

function createPNG(size) {
  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8); // width
  ihdr.writeUInt32BE(size, 12); // height
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // color type (RGB)
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace

  // Calculate CRC for IHDR
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(ihdrCrc, 21);

  // Create image data
  const rawData = [];
  const padding = Math.floor(size * 0.15);
  const letterWidth = Math.floor(size * 0.5);
  const letterHeight = Math.floor(size * 0.6);
  const startX = Math.floor((size - letterWidth) / 2);
  const startY = Math.floor((size - letterHeight) / 2);
  const thickness = Math.max(2, Math.floor(size * 0.12));

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      // Background: light gray (#fafafa)
      let r = 250, g = 250, b = 250;

      // Check if we're drawing the "T" letter
      const inTopBar = y >= startY && y < startY + thickness &&
                       x >= startX && x < startX + letterWidth;
      const inStem = y >= startY && y < startY + letterHeight &&
                     x >= startX + (letterWidth - thickness) / 2 &&
                     x < startX + (letterWidth + thickness) / 2;

      if (inTopBar || inStem) {
        // Letter: black
        r = 24; g = 24; b = 27;
      }

      rawData.push(r, g, b);
    }
  }

  // Compress with zlib (simple deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  // IDAT chunk
  const idat = Buffer.alloc(compressed.length + 12);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  idat.writeUInt32BE(idatCrc, compressed.length + 8);

  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation
function crc32(buffer) {
  let crc = 0xffffffff;
  const table = [];

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

// Generate icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const png = createPNG(size);
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), png);
  console.log(`Created ${filename}`);
});

console.log('Icons generated successfully!');
