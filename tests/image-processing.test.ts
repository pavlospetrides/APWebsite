import { describe, expect, it } from 'vitest';
import { containDimensions, coverOutputDimensions, coverSourceRect, derivativeStoragePath, detectImageKind, encodeCanvasWithFallback } from '../lib/admin-image-processing';

type ToBlob = HTMLCanvasElement['toBlob'];

function encodingCanvas(implementation: ToBlob) {
  return { toBlob: implementation };
}

describe('image content sniffing', () => {
  it('recognizes supported binary signatures rather than extensions', () => {
    expect(detectImageKind(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectImageKind(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectImageKind(new TextEncoder().encode('RIFFxxxxWEBP'))).toBe('webp');
    expect(detectImageKind(new TextEncoder().encode('xxxxftypavif'))).toBe('avif');
    expect(detectImageKind(new TextEncoder().encode('xxxxftypheic'))).toBe('heic');
  });
  it('rejects a renamed non-image payload', () => expect(detectImageKind(new TextEncoder().encode('<script>alert(1)</script>'))).toBeNull());
});

describe('resize and crop geometry', () => {
  it('keeps gallery composition and caps only the long edge', () => {
    expect(containDimensions(4032, 3024)).toEqual({ width: 2000, height: 1500 });
    expect(containDimensions(3024, 4032)).toEqual({ width: 1500, height: 2000 });
    expect(containDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('creates a centered 8:5 source crop without distortion', () => {
    expect(coverSourceRect(4000, 3000)).toEqual({ x: 0, y: 250, width: 4000, height: 2500 });
    expect(coverSourceRect(3000, 4000)).toEqual({ x: 0, y: 1062.5, width: 3000, height: 1875 });
  });
  it('does not upscale small cover sources', () => {
    expect(coverOutputDimensions(800, 600)).toEqual({ width: 800, height: 500 });
    expect(coverOutputDimensions(4000, 3000)).toEqual({ width: 1600, height: 1000 });
  });
});

describe('browser derivative encoding', () => {
  it('prefers a usable WebP blob and reports the matching extension and MIME type', async () => {
    const canvas = encodingCanvas((callback, type) => callback(new Blob(['webp'], { type })));

    const derivative = await encodeCanvasWithFallback(canvas);

    expect(derivative.mimeType).toBe('image/webp');
    expect(derivative.extension).toBe('webp');
    expect(derivative.blob.size).toBeGreaterThan(0);
    expect(derivativeStoragePath('projects/id/file', 'gallery', derivative)).toBe('projects/id/file-gallery.webp');
  });

  it('falls back to JPEG when WebP returns a null blob', async () => {
    const requests: Array<{ type?: string; quality?: number }> = [];
    const canvas = encodingCanvas((callback, type, quality) => {
      requests.push({ type, quality });
      callback(type === 'image/webp' ? null : new Blob(['jpeg'], { type }));
    });

    const derivative = await encodeCanvasWithFallback(canvas);

    expect(requests).toEqual([
      { type: 'image/webp', quality: 0.84 },
      { type: 'image/jpeg', quality: 0.88 },
    ]);
    expect(derivative.mimeType).toBe('image/jpeg');
    expect(derivative.blob.type).toBe('image/jpeg');
    expect(derivative.extension).toBe('jpg');
    expect(derivativeStoragePath('projects/id/file', 'cover', derivative)).toBe('projects/id/file-cover.jpg');
  });

  it('falls back to JPEG when WebP returns an empty blob', async () => {
    const canvas = encodingCanvas((callback, type) => callback(new Blob(type === 'image/webp' ? [] : ['jpeg'], { type })));

    await expect(encodeCanvasWithFallback(canvas)).resolves.toMatchObject({ mimeType: 'image/jpeg', extension: 'jpg' });
  });

  it('falls back to JPEG when WebP encoding throws', async () => {
    const canvas = encodingCanvas((callback, type) => {
      if (type === 'image/webp') throw new Error('WebP unsupported');
      callback(new Blob(['jpeg'], { type }));
    });

    await expect(encodeCanvasWithFallback(canvas)).resolves.toMatchObject({ mimeType: 'image/jpeg', extension: 'jpg' });
  });

  it('reports a final processing error only when WebP and JPEG both fail', async () => {
    const canvas = encodingCanvas((callback) => callback(null));

    await expect(encodeCanvasWithFallback(canvas)).rejects.toMatchObject({ code: 'encode' });
  });
});
