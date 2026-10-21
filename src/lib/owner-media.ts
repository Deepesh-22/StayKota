export interface SuggestedSamplePhoto {
  src: string;
  label: string;
  caption: string;
}

export const SUGGESTED_SAMPLE_PHOTOS: SuggestedSamplePhoto[] = [
  {
    src: '/images/room-shared.webp',
    label: 'Shared room',
    caption: 'Shared bedroom',
  },
  {
    src: '/images/room-single.webp',
    label: 'Single study room',
    caption: 'Single bedroom',
  },
  {
    src: '/images/hostel-exterior.webp',
    label: 'Building exterior',
    caption: 'Hostel exterior',
  },
];

const SAMPLE_SET = new Set(SUGGESTED_SAMPLE_PHOTOS.map((item) => item.src));

export function isSamplePhoto(src: string): boolean {
  return SAMPLE_SET.has(src);
}

export function hasRealUploadedPhotos(images: string[]): boolean {
  return images.some((src) => Boolean(src) && !isSamplePhoto(src));
}

export function cleanCaptionFromFilename(filename: string): string {
  const stem = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stem || /^(img|dsc|pxl|whatsapp|image|photo|screenshot)\b/i.test(stem)) {
    return 'Property photo';
  }
  return stem.charAt(0).toUpperCase() + stem.slice(1).slice(0, 48);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read selected image file.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Reads and compresses an owner-uploaded image file into an optimized data URL
 * (max 1280×960) so multiple real photos save smoothly in localStorage without hitting browser quota.
 */
export async function processUploadedPhoto(file: File): Promise<{ src: string; caption: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`“${file.name}” is not a supported image file. Upload JPG, PNG, or WebP photos.`);
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error(`“${file.name}” exceeds the 25 MB limit per photo.`);
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const caption = cleanCaptionFromFilename(file.name);

  if (typeof document === 'undefined') {
    return { src: rawDataUrl, caption };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxWidth = 1280;
        const maxHeight = 960;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ src: rawDataUrl, caption });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webp = canvas.toDataURL('image/webp', 0.82);
        const compressed = webp.startsWith('data:image/webp')
          ? webp
          : canvas.toDataURL('image/jpeg', 0.82);
        resolve({ src: compressed, caption });
      } catch {
        resolve({ src: rawDataUrl, caption });
      }
    };
    img.onerror = () => resolve({ src: rawDataUrl, caption });
    img.src = rawDataUrl;
  });
}
