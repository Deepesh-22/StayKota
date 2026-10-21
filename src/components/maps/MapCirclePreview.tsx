import { useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import '../../styles/map-circle-preview.css';

export interface MapCirclePreviewProps {
  id: string;
  name: string;
  subtitle: string;
  image?: string;
  kind: 'hostel' | 'campus';
}

function clippedLabel(value: string, limit = 23) {
  const text = value.trim().replace(/\s+/g, ' ').toUpperCase();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

function ringLabels(name: string, subtitle: string) {
  const text = name.trim().replace(/\s+/g, ' ').toUpperCase();
  if (text.length <= 23) return { top: text, bottom: clippedLabel(subtitle) };
  // Keep full words on the first arc; use the second arc for a long campus name.
  const breakpoint = text.lastIndexOf(' ', 23);
  if (breakpoint >= 8) return { top: text.slice(0, breakpoint), bottom: clippedLabel(text.slice(breakpoint + 1)) };
  return { top: clippedLabel(text), bottom: clippedLabel(subtitle) };
}

/** Circular ring & cover photo preview shown over map markers on hover, focus, or first touch tap. */
export function MapCirclePreview({ id, name, subtitle, image, kind }: MapCirclePreviewProps) {
  const instance = useId().replace(/:/g, '');
  const topPath = `map-circle-top-${instance}`;
  const bottomPath = `map-circle-bottom-${instance}`;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const labels = ringLabels(name, subtitle);
  const label = `${name} · ${subtitle} · ${kind === 'campus' ? 'Coaching campus' : 'Hostel'}`;

  return (
    <div className={`map-circle-preview map-circle-preview--${kind}`} data-preview-id={id} role="img" aria-label={label}>
      <svg className="map-circle-preview__ring" viewBox="0 0 164 164" aria-hidden="true" focusable="false">
        <defs>
          <path id={topPath} d="M 17 82 A 65 65 0 0 1 147 82" />
          <path id={bottomPath} d="M 10 82 A 72 72 0 0 0 154 82" />
        </defs>
        <circle cx="82" cy="82" r="68" className="map-circle-preview__band" />
        <circle cx="82" cy="82" r="81.2" className="map-circle-preview__rim" />
        <text className="map-circle-preview__name" textAnchor="middle">
          <textPath href={`#${topPath}`} startOffset="50%" textLength={labels.top.length > 19 ? 190 : undefined} lengthAdjust="spacing">
            {labels.top}
          </textPath>
        </text>
        <text className="map-circle-preview__subtitle" textAnchor="middle">
          <textPath href={`#${bottomPath}`} startOffset="50%" textLength={labels.bottom.length > 19 ? 185 : undefined} lengthAdjust="spacing">
            {labels.bottom}
          </textPath>
        </text>
        <circle cx="14" cy="82" r="2.4" className="map-circle-preview__dot" />
        <circle cx="150" cy="82" r="2.4" className="map-circle-preview__dot" />
      </svg>
      <span className="map-circle-preview__centre" data-preview-aperture={id} aria-hidden="true">
        {image && failedImage !== image ? (
          <img
            src={image}
            alt=""
            decoding="async"
            draggable={false}
            onError={() => setFailedImage(image)}
          />
        ) : (
          <MapPin className="map-circle-preview__pin" size={45} strokeWidth={1.7} fill="currentColor" />
        )}
      </span>
    </div>
  );
}
