import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Client-side image processing and upload helpers
export type ImageProcessOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1
  mimeType?: string; // e.g. 'image/jpeg' or 'image/webp'
};

export async function resizeImage(
  file: File,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = 'image/jpeg',
  }: ImageProcessOptions = {}
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = objectUrl;
    });

    const { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    const targetWidth = Math.round(width * ratio);
    const targetHeight = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) return reject(new Error('Failed to convert canvas to Blob'));
        resolve(b);
      }, mimeType, quality);
    });

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadToWorker(
  fileOrBlob: File | Blob,
  key: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const uploadUrl =
    (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL as string | undefined) ||
    (process.env.EXPO_PUBLIC_IMAGE_UPLOAD_URL as string | undefined);

  if (!uploadUrl) throw new Error('Image upload URL is not configured');

  const formData = new FormData();
  const file = fileOrBlob instanceof File
    ? fileOrBlob
    : new File([fileOrBlob], 'image.jpg', { type: mimeType });
  formData.append('file', file);
  formData.append('key', key);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data || !data.url) throw new Error('Upload did not return a url');
  return data.url as string;
}

export async function processAndUploadImage(
  file: File,
  key: string,
  options?: ImageProcessOptions
): Promise<string> {
  const blob = await resizeImage(file, options);
  const mimeType = options?.mimeType ?? 'image/jpeg';
  return uploadToWorker(blob, key, mimeType);
}
