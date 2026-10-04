import Image from "next/image";

/**
 * Animated hero illustration: rotating sun, drifting clouds, swaying crops with
 * watering drops, and the spotlight product floating in front. Pure SVG + CSS
 * (no JavaScript); animations stop for "reduce motion" users.
 */
export function HeroScene({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const plants = Array.from({ length: 13 }, (_, i) => i);

  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl sm:aspect-[16/6]">
      <svg
        viewBox="0 0 1200 450"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
        role="presentation"
        aria-hidden
      >
        <defs>
          <radialGradient id="hero-glow" cx="50%" cy="55%" r="45%">
            <stop offset="0" stopColor="#fbe38a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fbe38a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sun with slowly turning rays */}
        <g transform="translate(1030 95)">
          <g className="svg-part animate-spin-slow">
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x="-3"
                y="-78"
                width="6"
                height="22"
                rx="3"
                fill="#fbe38a"
                transform={`rotate(${i * 30})`}
              />
            ))}
          </g>
          <circle r="44" fill="#f9d65c" />
        </g>

        {/* Drifting clouds */}
        <g className="svg-part animate-drift" opacity="0.85">
          <ellipse cx="220" cy="90" rx="70" ry="22" fill="#ffffff" />
          <ellipse cx="260" cy="75" rx="45" ry="24" fill="#ffffff" />
        </g>
        <g className="svg-part animate-drift [animation-delay:-6s]" opacity="0.6">
          <ellipse cx="760" cy="60" rx="55" ry="17" fill="#ffffff" />
          <ellipse cx="790" cy="48" rx="34" ry="18" fill="#ffffff" />
        </g>

        {/* Glow behind the product */}
        <ellipse cx="600" cy="250" rx="330" ry="200" fill="url(#hero-glow)" />

        {/* Hills */}
        <path d="M0 330 Q200 250 420 300 T850 280 T1200 290 V450 H0Z" fill="#7cb342" />
        <path d="M0 370 Q260 310 520 350 T1200 335 V450 H0Z" fill="#43a047" />
        <path d="M0 410 Q300 370 640 400 T1200 395 V450 H0Z" fill="#2e7d32" />

        {/* Swaying crops with watering drops */}
        {plants.map((i) => {
          const x = 45 + i * 92;
          const y = 412 - (i % 3) * 6;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g
                className="svg-part origin-bottom-center animate-grow"
                style={{ animationDelay: `${300 + i * 70}ms` }}
              >
                <g
                  className="svg-part origin-bottom-center animate-sway"
                  style={{ animationDelay: `${-i * 0.37}s` }}
                >
                  <path d="M0 0 V-46" stroke="#1b5e20" strokeWidth="4" strokeLinecap="round" />
                  <path d="M0 -24 C-22 -32 -26 -50 -18 -56 C-4 -50 0 -36 0 -24Z" fill="#c5e1a5" />
                  <path d="M0 -30 C22 -38 26 -56 18 -62 C4 -56 0 -42 0 -30Z" fill="#dcedc8" />
                  <circle cy="-50" r="5" fill={i % 2 ? "#f9d65c" : "#ffffff"} />
                </g>
              </g>
              {i % 2 === 0 && (
                <ellipse
                  cx="0"
                  cy="-120"
                  rx="3"
                  ry="6"
                  fill="#bbdefb"
                  className="svg-part animate-drop"
                  style={{ animationDelay: `${i * 0.31}s` }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* The product itself, floating above the field */}
      <div className="absolute bottom-[26%] left-1/2 aspect-square w-[34%] max-w-64 -translate-x-1/2 sm:bottom-[14%] sm:w-[28%]">
        <div className="animate-bob size-full">
          <div className="rounded-card relative size-full overflow-hidden bg-white/95 p-2 shadow-2xl ring-4 ring-white/60">
            {imageUrl ? (
              <Image src={imageUrl} alt={alt} fill sizes="260px" priority className="object-contain p-2" />
            ) : (
              <svg viewBox="0 0 120 120" role="img" aria-label={alt} className="size-full">
                <rect x="44" y="10" width="32" height="16" rx="3" fill="#2e7d32" />
                <rect x="30" y="26" width="60" height="86" rx="10" fill="#1b5e20" />
                <rect x="30" y="56" width="60" height="26" fill="#f9d65c" />
                <path
                  d="M60 64 c-8 -2 -10 -8 -7 -11 c5 2 7 6 7 11z M60 66 c8 -2 10 -8 7 -11 c-5 2 -7 6 -7 11z"
                  fill="#1b5e20"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
