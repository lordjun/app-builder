import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const outputDir = fileURLToPath(new URL('../validation-fixtures/', import.meta.url));

await mkdir(outputDir, { recursive: true });

await Promise.all([
  writeFile(join(outputDir, 'image-blue.png'), createPng(240, 160, [41, 115, 171])),
  writeFile(join(outputDir, 'image-green.png'), createPng(240, 160, [47, 111, 94])),
  writeFile(join(outputDir, 'unsupported.txt'), 'Unsupported file type fixture.\n'),
  writeFile(join(outputDir, 'oversize-26mb.bin'), Buffer.alloc(26 * 1024 * 1024, 65)),
]);

await writePdf('sample-a.pdf', ['Sample A - page 1', 'Sample A - page 2']);
await writePdf('sample-b.pdf', ['Sample B - page 1']);
await writePdf('numbered-4-pages.pdf', ['Page 1', 'Page 2', 'Page 3', 'Page 4']);
await writePdf('already-small.pdf', ['Already small PDF']);

console.log(`Validation fixtures written to ${outputDir}`);

async function writePdf(filename, labels) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  labels.forEach((label) => {
    const page = pdf.addPage([612, 792]);
    page.drawText(label, {
      x: 72,
      y: 700,
      size: 36,
      font,
      color: rgb(0.09, 0.13, 0.15),
    });
    page.drawText('Privacy PDF Toolbox validation fixture', {
      x: 72,
      y: 660,
      size: 14,
      color: rgb(0.31, 0.38, 0.43),
    });
  });

  await writeFile(join(outputDir, filename), await pdf.save({ useObjectStreams: true }));
}

function createPng(width, height, color) {
  const bytesPerPixel = 3;
  const rowLength = 1 + width * bytesPerPixel;
  const raw = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    raw[rowStart] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      const stripe = Math.floor(x / 24) % 2 === 0 ? 0 : 28;
      raw[pixelStart] = Math.min(color[0] + stripe, 255);
      raw[pixelStart + 1] = Math.min(color[1] + stripe, 255);
      raw[pixelStart + 2] = Math.min(color[2] + stripe, 255);
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 2, 0, 0, 0]),
    ])),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  return Buffer.concat([
    uint32(data.length),
    typeBytes,
    data,
    uint32(crc32(Buffer.concat([typeBytes, data]))),
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
