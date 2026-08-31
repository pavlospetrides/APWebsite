import sharp from 'sharp';

function pixels(width, height, seed = 42) {
  const buffer = Buffer.allocUnsafe(width * height * 3);
  let random = seed >>> 0;
  for (let y = 0, index = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      random = (1664525 * random + 1013904223) >>> 0;
      const grain = (random >>> 24) - 128;
      buffer[index++] = Math.max(0, Math.min(255, 42 + (x / width) * 170 + grain * 0.55));
      buffer[index++] = Math.max(0, Math.min(255, 70 + (y / height) * 145 + grain * 0.42));
      buffer[index++] = Math.max(0, Math.min(255, 125 + Math.sin((x + y) / 57) * 55 + grain * 0.48));
    }
  }
  return buffer;
}

async function source(width, height, format, options = {}, orientation) {
  let pipeline = sharp(pixels(width, height, width + height), { raw: { width, height, channels: 3 } });
  if (orientation) pipeline = pipeline.withMetadata({ orientation });
  return pipeline[format](options).toBuffer();
}

async function optimize(name, input) {
  const metadata = await sharp(input).metadata();
  const rotated = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8;
  const normalizedWidth = rotated ? metadata.height : metadata.width;
  const normalizedHeight = rotated ? metadata.width : metadata.height;
  const targetRatio = 1.6;
  const sourceRatio = normalizedWidth / normalizedHeight;
  const cropWidth = sourceRatio > targetRatio ? normalizedHeight * targetRatio : normalizedWidth;
  const cropHeight = sourceRatio > targetRatio ? normalizedHeight : normalizedWidth / targetRatio;
  const coverScale = Math.min(1, 1600 / cropWidth, 1000 / cropHeight);
  const coverWidth = Math.round(cropWidth * coverScale);
  const coverHeight = Math.round(cropHeight * coverScale);
  const normalized = sharp(input).autoOrient();
  const [gallery, cover] = await Promise.all([
    normalized.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
    normalized.clone().resize(coverWidth, coverHeight, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toBuffer(),
  ]);
  const galleryMeta = await sharp(gallery).metadata();
  return {
    name,
    source: `${metadata.width}x${metadata.height}${metadata.orientation ? ` EXIF:${metadata.orientation}` : ''}`,
    originalBytes: input.length,
    galleryBytes: gallery.length,
    coverBytes: cover.length,
    storedBytes: gallery.length + cover.length,
    output: `${galleryMeta.width}x${galleryMeta.height} WebP`,
  };
}

const fixtures = [
  ['500 KB-class PNG', await source(520, 380, 'png', { compressionLevel: 6 })],
  ['500 KB-class JPEG', await source(1200, 800, 'jpeg', { quality: 88 })],
  ['5 MB-class iPhone JPEG', await source(4032, 3024, 'jpeg', { quality: 85 })],
  ['10+ MB phone JPEG', await source(5000, 4000, 'jpeg', { quality: 100 })],
  ['portrait EXIF 6 JPEG', await source(4032, 3024, 'jpeg', { quality: 92 }, 6)],
  ['landscape JPEG', await source(4032, 3024, 'jpeg', { quality: 92 })],
  ['WebP input', await source(1800, 1200, 'webp', { quality: 90 })],
  ['AVIF input', await source(1800, 1200, 'avif', { quality: 70 })],
];

const results = [];
for (const [name, input] of fixtures) results.push(await optimize(name, input));

let corruptedRejected = false;
try {
  await sharp(Buffer.from('not an image')).metadata();
} catch {
  corruptedRejected = true;
}

const multiple = await Promise.all(fixtures.slice(0, 3).map(([name, input]) => optimize(`parallel ${name}`, input)));

console.table(results.map((result) => {
  const delta = Math.round((result.storedBytes / result.originalBytes - 1) * 100);
  return {
  fixture: result.name,
  source: result.source,
  originalMB: (result.originalBytes / 1024 / 1024).toFixed(2),
  galleryKB: Math.round(result.galleryBytes / 1024),
  coverKB: Math.round(result.coverBytes / 1024),
  storedDelta: `${delta > 0 ? '+' : ''}${delta}%`,
  output: result.output,
  };
}));
console.log(JSON.stringify({ corruptedRejected, parallelImagesCompleted: multiple.length }));

if (!corruptedRejected || multiple.length !== 3) process.exitCode = 1;
