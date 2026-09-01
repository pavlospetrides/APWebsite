export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 60_000_000;
export const GALLERY_LONG_EDGE = 2000;
export const COVER_WIDTH = 1600;
export const COVER_HEIGHT = 1000;
export const WEBP_QUALITY = 0.84;
export const JPEG_FALLBACK_QUALITY = 0.88;

export type DerivativeMimeType = 'image/webp' | 'image/jpeg';
export type EncodedDerivative = {
  blob: Blob;
  mimeType: DerivativeMimeType;
  extension: 'webp' | 'jpg';
};

export type SupportedImageKind = 'jpeg' | 'png' | 'webp' | 'avif' | 'heic';
export type ProcessedProjectImage = {
  gallery: EncodedDerivative;
  cover: EncodedDerivative;
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

type BlobEncodingCanvas = Pick<HTMLCanvasElement, 'toBlob'>;

function canvasBlob(canvas: BlobEncodingCanvas, mimeType: DerivativeMimeType, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.size === 0 || blob.type.toLowerCase() !== mimeType) {
        reject(new Error(`Canvas returned an unusable ${mimeType} blob.`));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export async function encodeCanvasWithFallback(canvas: BlobEncodingCanvas): Promise<EncodedDerivative> {
  try {
    const blob = await canvasBlob(canvas, 'image/webp', WEBP_QUALITY);
    return { blob, mimeType: 'image/webp', extension: 'webp' };
  } catch {
    try {
      const blob = await canvasBlob(canvas, 'image/jpeg', JPEG_FALLBACK_QUALITY);
      return { blob, mimeType: 'image/jpeg', extension: 'jpg' };
    } catch {
      throw new ImageProcessingError('encode', 'Η συσκευή δεν μπόρεσε να δημιουργήσει βελτιστοποιημένη εικόνα. Δοκίμασε άλλη εικόνα ή μικρότερο αρχείο.');
    }
  }
}

export function derivativeStoragePath(base: string, variant: 'gallery' | 'cover', derivative: EncodedDerivative) {
  return `${base}-${variant}.${derivative.extension}`;
}

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve({
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => {
        image.src = '';
        URL.revokeObjectURL(objectUrl);
      },
    });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image element decode failed.'));
    };
    image.src = objectUrl;
  });
}

async function decodeOriented(file: File, kind: SupportedImageKind): Promise<DecodedImage> {
  try {
    if (typeof createImageBitmap !== 'function') throw new Error('createImageBitmap is unavailable.');
    // Do not retry without `from-image`: Safari and Chromium have historically
    // differed here. The HTMLImageElement fallback also applies EXIF orientation.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    try {
      return await decodeWithImageElement(file);
    } catch {
      if (kind === 'heic') {
        throw new ImageProcessingError('unsupported-heic', 'Η μορφή HEIC/HEIF δεν υποστηρίζεται από αυτό το πρόγραμμα περιήγησης ή τη συσκευή. Εξήγαγε τη φωτογραφία ως JPEG και δοκίμασε ξανά.');
      }
      throw new ImageProcessingError('decode', 'Δεν ήταν δυνατή η ανάγνωση της εικόνας. Το αρχείο μπορεί να είναι κατεστραμμένο ή η μορφή να μην υποστηρίζεται στη συσκευή.');
    }
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

  const decoded = await decodeOriented(file, kind);
  try {
    if (!decoded.width || !decoded.height || decoded.width * decoded.height > MAX_SOURCE_PIXELS) {
      throw new ImageProcessingError('dimensions', 'Η εικόνα έχει μη έγκυρες ή υπερβολικά μεγάλες διαστάσεις (μέγιστο 60 megapixel).');
    }

    const gallerySize = containDimensions(decoded.width, decoded.height);
    const canvas = document.createElement('canvas');
    canvas.width = gallerySize.width;
    canvas.height = gallerySize.height;
    const galleryContext = canvas.getContext('2d', { alpha: false });
    if (!galleryContext) throw new ImageProcessingError('encode', 'Δεν ήταν δυνατή η προετοιμασία της εικόνας.');
    galleryContext.imageSmoothingEnabled = true;
    galleryContext.imageSmoothingQuality = 'high';
    galleryContext.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

    try {
      // Encode sequentially and reuse one derivative-sized canvas so large phone
      // photos do not retain gallery and cover canvases at the same time.
      const gallery = await encodeCanvasWithFallback(canvas);
      const coverSize = coverOutputDimensions(decoded.width, decoded.height);
      canvas.width = coverSize.width;
      canvas.height = coverSize.height;
      const coverContext = canvas.getContext('2d', { alpha: false });
      if (!coverContext) throw new ImageProcessingError('encode', 'Δεν ήταν δυνατή η προετοιμασία του εξωφύλλου.');
      const source = coverSourceRect(decoded.width, decoded.height);
      coverContext.imageSmoothingEnabled = true;
      coverContext.imageSmoothingQuality = 'high';
      coverContext.drawImage(decoded.source, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
      const cover = await encodeCanvasWithFallback(canvas);

      return {
        gallery,
        cover,
        width: gallerySize.width,
        height: gallerySize.height,
        originalBytes: file.size,
        optimizedBytes: gallery.blob.size + cover.blob.size,
      };
    } finally {
      canvas.width = canvas.height = 1;
    }
  } finally {
    decoded.close();
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
