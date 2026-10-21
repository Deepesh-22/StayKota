import { describe, expect, it } from 'vitest';
import {
  inferNearestKotaLocality,
  validateOwnerCoordinates,
} from '../src/lib/owner-location';
import {
  SUGGESTED_SAMPLE_PHOTOS,
  cleanCaptionFromFilename,
  hasRealUploadedPhotos,
  isSamplePhoto,
} from '../src/lib/owner-media';

describe('owner coordinates & auto-location helpers', () => {
  it('accepts blank pairs, Kota coordinates, and real GPS coordinates outside Kota while catching swaps', () => {
    expect(validateOwnerCoordinates('', '')).toEqual({ valid: true, empty: true });

    const kota = validateOwnerCoordinates('25.1481234', '75.8523456');
    expect(kota.valid).toBe(true);
    expect(kota.latitude).toBe(25.148123);
    expect(kota.longitude).toBe(75.852346);
    expect(kota.outsideKota).toBe(false);

    // Owner testing from Jaipur / Delhi / Mumbai still gets exact real GPS saved
    const outside = validateOwnerCoordinates('28.613939', '77.209021');
    expect(outside.valid).toBe(true);
    expect(outside.latitude).toBe(28.613939);
    expect(outside.longitude).toBe(77.209021);
    expect(outside.outsideKota).toBe(true);

    // Swapped longitude/latitude is rejected with helpful alert
    const swapped = validateOwnerCoordinates('75.852', '25.148');
    expect(swapped.valid).toBe(false);
    expect(swapped.swapped).toBe(true);
    expect(swapped.error).toContain('within Kota');

    // Half-filled pair is rejected
    const partial = validateOwnerCoordinates('25.148', '');
    expect(partial.valid).toBe(false);
    expect(partial.error).toContain('within Kota');
  });

  it('infers nearest Kota locality for coordinates inside Kota', () => {
    expect(inferNearestKotaLocality(25.1465, 75.8522)).toBe('Talwandi');
    expect(inferNearestKotaLocality(25.2148, 75.8595)).toBe('Landmark');
    expect(inferNearestKotaLocality(28.6139, 77.209)).toBeNull();
  });
});

describe('owner real photo upload & sample suggestion helpers', () => {
  it('distinguishes real uploaded data URLs from sample suggestion photos', () => {
    expect(SUGGESTED_SAMPLE_PHOTOS).toHaveLength(3);
    expect(isSamplePhoto('/images/room-shared.webp')).toBe(true);
    expect(isSamplePhoto('data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=')).toBe(false);

    expect(hasRealUploadedPhotos(['/images/room-shared.webp'])).toBe(false);
    expect(
      hasRealUploadedPhotos([
        '/images/room-shared.webp',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/',
      ]),
    ).toBe(true);
  });

  it('derives clean human captions from uploaded filenames', () => {
    expect(cleanCaptionFromFilename('double-ac-bedroom.jpg')).toBe('Double ac bedroom');
    expect(cleanCaptionFromFilename('IMG_20261022_142011.jpg')).toBe('Property photo');
    expect(cleanCaptionFromFilename('WhatsApp Image 2026-10-22.jpeg')).toBe('Property photo');
  });
});
