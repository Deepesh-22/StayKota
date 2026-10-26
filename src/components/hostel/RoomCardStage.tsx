import { Link } from 'react-router-dom';
import type { Hostel, RoomType } from '../../types';
import '../../styles/room-card.css';

function showFallback(image: HTMLImageElement) {
  if (!image.src.endsWith('/images/room-shared.webp')) {
    image.src = '/images/room-shared.webp';
  }
}

/** Single cover photo preview on hostel cards — full photo gallery & room details unlock after student login/signup. */
export function RoomCardStage({
  hostel,
  href,
}: {
  hostel: Hostel;
  room?: RoomType;
  href: string;
}) {
  const firstPhoto = hostel.coverImage || hostel.images[0] || '/images/room-shared.webp';

  return (
    <div className="room-card-stage" data-preview="photo">
      <Link
        to={href}
        className="room-card-photo-link"
        aria-label={`View ${hostel.name}`}
      >
        <img
          className="room-card-photo"
          src={firstPhoto}
          alt={`Cover photo of ${hostel.name}`}
          loading="lazy"
          decoding="async"
          onError={(event) => showFallback(event.currentTarget)}
        />
      </Link>
    </div>
  );
}
