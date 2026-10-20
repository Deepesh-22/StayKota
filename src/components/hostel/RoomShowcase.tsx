/** A decorative room sketch. It is not a measured floor plan or a property tour. */
export function RoomShowcase({ capacity }: { capacity: number }) {
  const beds = [[128, 144], [228, 175], [331, 154], [278, 118]].slice(0, Math.max(1, Math.min(capacity, 4)));
  return (
    <svg viewBox="0 0 600 280" aria-hidden="true" className="detail-room-scene__illustration">
      <defs>
        <linearGradient id="room-wall" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f4f0e2" /><stop offset="1" stopColor="#e2dac6" /></linearGradient>
        <linearGradient id="room-floor" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4d8bb" /><stop offset="1" stopColor="#f2e8d1" /></linearGradient>
      </defs>
      <ellipse cx="300" cy="238" rx="215" ry="19" fill="#355541" opacity=".07" />
      <g transform="translate(0 13)">
        <path d="M70 144 280 80 520 150 310 230Z" fill="url(#room-floor)" />
        <path d="M70 144 310 230 310 241 70 155Z" fill="#d0c5a8" />
        <path d="M310 230 520 150 520 161 310 241Z" fill="#bcad8c" />
        <path d="M70 144 70 64 280 0 280 80Z" fill="#ece7d8" />
        <path d="M280 80 280 0 520 70 520 150Z" fill="url(#room-wall)" />
        <path d="M70 64 78 66 280 5 280 0Z" fill="#fffdf3" />
        <path d="M280 0 520 70 512 74 280 6Z" fill="#fffdf3" />
        <path d="M355 30 435 53 435 109 355 86Z" fill="#b6caba" stroke="#fbf8eb" strokeWidth="5" />
        <path d="M395 43 395 98M355 59 435 82" stroke="#fbf8eb" strokeWidth="3" />
        <path d="M355 81 395 68 435 94 435 109Z" fill="#91b69d" opacity=".7" />
        <path d="M100 86 163 66 163 72 100 92Z" fill="#cabd9d" />
        <path d="M107 81 112 80 112 65 107 66ZM117 78 123 77 123 62 117 63ZM128 75 133 74 133 60 128 61ZM139 71 145 70 145 56 139 58Z" fill="#789c83" />
        <path d="M149 67 154 65 154 53 149 55Z" fill="#ba8868" />
        <path d="M417 128 455 115 494 128 455 141Z" fill="#bcab88" />
        <path d="M423 131 426 132 426 164 423 165ZM484 132 488 131 488 162 484 164Z" fill="#9a8d70" />
        <path d="M442 121 452 118 463 122 453 126Z" fill="#e9eadc" />
        <path d="M464 117 465 100 477 97" fill="none" stroke="#6a8068" strokeWidth="2" />
        <path d="M470 97 478 93 484 101 472 104Z" fill="#8b9b77" />
        {beds.map(([x, y], index) => <g key={index} transform={'translate(' + x + ' ' + y + ')'}>
          <path d="M0 4 37 -8 113 16 75 30Z" fill="#a79773" />
          <path d="M0 4 75 30 75 38 0 12Z" fill="#b7a581" />
          <path d="M75 30 113 16 113 24 75 38Z" fill="#958563" />
          <path d="M0 -4 37 -16 113 8 75 22Z" fill="#f7f2e5" />
          <path d="M0 -4 75 22 75 30 0 4Z" fill="#e5e3d4" />
          <path d="M75 22 113 8 113 16 75 30Z" fill="#cfdbcd" />
          <path d="M27 5 65 -7 113 8 75 22Z" fill={index % 2 ? '#9ab0a1' : '#a5b894'} />
          <path d="M27 5 75 22 75 30 27 13Z" fill={index % 2 ? '#8b9f92' : '#96aa86'} />
          <path d="M8 -3 33 -11 49 -6 24 2Z" fill="#fffdf4" />
          <path d="M2 -7 2 -21 40 -33 40 -13" fill="none" stroke="#a79773" strokeWidth="5" />
        </g>)}
        <path d="M475 153 491 158 488 181 478 178Z" fill="#d8b69a" />
        <path d="M483 157 482 133M483 146Q466 145 468 134Q480 131 483 146M483 141Q498 142 499 129Q486 126 483 141" fill="#81996e" stroke="#81996e" strokeWidth="2" />
      </g>
    </svg>
  );
}
