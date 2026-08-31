export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 60_000_000;
export const GALLERY_LONG_EDGE = 2000;
export const COVER_WIDTH = 1600;
export const COVER_HEIGHT = 1000;
export const OUTPUT_QUALITY = 0.84;

export type SupportedImageKind = 'jpeg' | 'png' | 'webp' | 'avif' | 'heic';
export type ProcessedProjectImage = {
  galleryBlob: Blob;
  coverBlob: Blob;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
};

export class ImageProcessingError extends Error {
  constructor(public readonly code: 'too-large' | 'not-image' | 'unsupported-heic' | 'decode' | 'dimensions' | 'encode', message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectImageKind(bytes: Uint8Array): SupportedImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'png';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp';
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (['avif', 'avis'].includes(brand)) return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'heic';
  }
  return null;
}

export function containDimensions(width: number, height: number, longEdge = GALLERY_LONG_EDGE) {
  const scale = Math.min(1, longEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function coverSourceRect(width: number, height: number, targetWidth = COVER_WIDTH, targetHeight = COVER_HEIGHT) {
  const sourceRatio = width / height;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const cropWidth = height * targetRatio;
    return { x: (width - cropWidth) / 2, y: 0, width: cropWidth, height };
  }
  const cropHeight = width / targetRatio;
  return { x: 0, y: (height - cropHeight) / 2, width, height: cropHeight };
}

export function coverOutputDimensions(width: number, height: number) {
  const source = coverSourceRect(width, height);
  const scale = Math.min(1, COVER_WIDTH / source.width, COVER_HEIGHT / source.height);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== 'image/webp') {
        reject(new ImageProcessingError('encode', 'Η συσκευή δεν μπόρεσε να δημιουργήσει βελτιστοποιημένο WebP.'));
        return;
      }
      resolve(blob);
    }, 'image/webp', OUTPUT_QUALITY);
  });
}

async function decodeOriented(file: File, kind: SupportedImageKind): Promise<ImageBitmap> {
  try {
    // `from-image` applies EXIF orientation during decode. Drawing the bitmap to
    // canvas then normalizes pixels and drops camera metadata from both outputs.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    if (kind === 'heic') {
      throw new ImageProcessingError('unsupported-heic', 'Η μορφή HEIC/HEIF δεν υποστηρίζεται από αυτό το πρόγραμμα περιήγησης ή τη συσκευή. Εξήγαγε τη φωτογραφία ως JPEG και δοκίμασε ξανά.');
    }
    throw new ImageProcessingError('decode', 'Δεν ήταν δυνατή η ανάγνωση της εικόνας. Το αρχείο μπορεί να είναι κατεστραμμένο ή η μορφή να μην υποστηρίζεται στη συσκευή.');
  }
}

export async function processProjectImage(file: File): Promise<ProcessedProjectImage> {
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new ImageProcessingError('too-large', 'Το αρχείο ξεπερνά το όριο πηγής των 25 MB.');
  }
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const kind = detectImageKind(header);
  if (!kind) {
    throw new ImageProcessingError('not-image', 'Το περιεχόμενο του αρχείου δεν είναι υποστηριζόμενη εικόνα JPEG, PNG, WebP, AVIF ή HEIC/HEIF.');
  }

  const bitmap = await decodeOriented(file, kind);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) {
      throw new ImageProcessingError('dimensions', 'Η εικόνα έχει μη έγκυρες ή υπερβολικά μεγάλες διαστάσεις (μέγιστο 60 megapixel).');
    }

    const gallerySize = containDimensions(bitmap.width, bitmap.height);
    const gallery = document.createElement('canvas');
    gallery.width = gallerySize.width;
    gallery.height = gallerySize.height;
    const galleryContext = gallery.getContext('2d', { alpha: false });
    if (!galleryContext) throw new ImageProcessingError('encode', 'Δεν ήταν δυνατή η προετοιμασία της εικόνας.');
    galleryContext.imageSmoothingEnabled = true;
    galleryContext.imageSmoothingQuality = 'high';
    galleryContext.drawImage(bitmap, 0, 0, gallery.width, gallery.height);

    const cover = document.createElement('canvas');
    const coverSize = coverOutputDimensions(bitmap.width, bitmap.height);
    cover.width = coverSize.width;
    cover.height = coverSize.height;
    const coverContext = cover.getContext('2d', { alpha: false });
    if (!coverContext) throw new ImageProcessingError('encode', 'Δεν ήταν δυνατή η προετοιμασία του εξωφύλλου.');
    const source = coverSourceRect(bitmap.width, bitmap.height);
    coverContext.imageSmoothingEnabled = true;
    coverContext.imageSmoothingQuality = 'high';
    coverContext.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, cover.width, cover.height);

    const [galleryBlob, coverBlob] = await Promise.all([canvasBlob(gallery), canvasBlob(cover)]);
    gallery.width = gallery.height = cover.width = cover.height = 1;
    return {
      galleryBlob,
      coverBlob,
      width: gallerySize.width,
      height: gallerySize.height,
      originalBytes: file.size,
      optimizedBytes: galleryBlob.size + coverBlob.size,
    };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
