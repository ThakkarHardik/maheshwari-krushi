/**
 * Lightweight SVG illustrations in the brand colours. They stand in for real
 * photos until the shop's own pictures are added (see AboutPhoto).
 */
type Props = { className?: string; title: string };

export function FieldsIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 480 320" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8f5e1" />
          <stop offset="1" stopColor="#f9fbe7" />
        </linearGradient>
      </defs>
      <rect width="480" height="320" fill="url(#sky)" />
      <circle cx="390" cy="70" r="34" fill="#f9d65c" />
      <path d="M0 200 Q120 150 240 185 T480 170 V320 H0Z" fill="#7cb342" />
      <path d="M0 230 Q140 190 260 225 T480 215 V320 H0Z" fill="#43a047" />
      <path d="M0 265 Q160 235 300 262 T480 255 V320 H0Z" fill="#2e7d32" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} transform={`translate(${30 + i * 52} ${270 - (i % 2) * 6})`}>
          <path d="M0 30 V8" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 14 C-12 6 -14 -4 -10 -8 C-2 -4 0 6 0 14Z" fill="#c5e1a5" />
          <path d="M0 18 C12 10 14 0 10 -4 C2 0 0 10 0 18Z" fill="#dcedc8" />
        </g>
      ))}
    </svg>
  );
}

export function ShopIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 480 320" role="img" aria-label={title} className={className}>
      <rect width="480" height="320" fill="#f1f8e9" />
      <rect x="0" y="270" width="480" height="50" fill="#dfe6da" />
      <rect x="70" y="90" width="340" height="180" rx="6" fill="#ffffff" stroke="#1b5e20" strokeWidth="4" />
      <rect x="60" y="62" width="360" height="52" rx="8" fill="#1b5e20" />
      <text
        x="240"
        y="96"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="22"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        महेश्वरी कृषि सेवा केन्द्र
      </text>
      <path d="M70 114 h340 l-14 26 h-312z" fill="#f9d65c" />
      <rect x="100" y="160" width="110" height="110" rx="4" fill="#e8f5e1" stroke="#2e7d32" strokeWidth="3" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={110 + c * 33}
            y={172 + r * 32}
            width="24"
            height="24"
            rx="3"
            fill={(r + c) % 2 ? "#43a047" : "#f9d65c"}
          />
        )),
      )}
      <rect x="250" y="160" width="130" height="110" rx="4" fill="#c5e1a5" stroke="#2e7d32" strokeWidth="3" />
      <rect x="290" y="190" width="50" height="80" fill="#2e7d32" />
      <circle cx="330" cy="232" r="3" fill="#f9d65c" />
    </svg>
  );
}

export function AdviceIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 480 320" role="img" aria-label={title} className={className}>
      <rect width="480" height="320" fill="#fffbea" />
      <circle cx="240" cy="160" r="120" fill="#dcedc8" />
      {/* farmer */}
      <circle cx="175" cy="120" r="28" fill="#8d6e63" />
      <path d="M140 108 h70 l-8 -18 h-54z" fill="#f9d65c" />
      <path d="M135 250 q0 -80 40 -80 q40 0 40 80z" fill="#43a047" />
      {/* advisor */}
      <circle cx="305" cy="122" r="26" fill="#a1887f" />
      <path d="M270 250 q0 -78 35 -78 q35 0 35 78z" fill="#1b5e20" />
      {/* speech bubbles */}
      <rect x="200" y="40" width="80" height="40" rx="12" fill="#ffffff" stroke="#2e7d32" strokeWidth="2" />
      <path d="M220 80 l-6 14 l16 -14z" fill="#ffffff" stroke="#2e7d32" strokeWidth="2" />
      <circle cx="225" cy="60" r="4" fill="#2e7d32" />
      <circle cx="240" cy="60" r="4" fill="#2e7d32" />
      <circle cx="255" cy="60" r="4" fill="#2e7d32" />
      {/* seedling between them */}
      <path d="M240 250 v-40" stroke="#1b5e20" strokeWidth="4" strokeLinecap="round" />
      <path d="M240 222 c-18 -6 -22 -20 -16 -26 c12 4 16 16 16 26z" fill="#7cb342" />
      <path d="M240 228 c18 -6 22 -20 16 -26 c-12 4 -16 16 -16 26z" fill="#43a047" />
    </svg>
  );
}
