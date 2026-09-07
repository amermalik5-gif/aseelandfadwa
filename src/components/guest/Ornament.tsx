/** Hand-drawn olive sprig, mirrored around a small diamond. Inherits currentColor. */
export function OliveSprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        {/* left branch */}
        <path d="M14 14 Q 55 10, 96 14" />
        <path d="M30 14 Q 34 6, 42 5 Q 38 12, 30 14" fill="currentColor" fillOpacity="0.5" />
        <path d="M48 13 Q 50 20, 58 22 Q 56 14, 48 13" fill="currentColor" fillOpacity="0.5" />
        <path d="M64 12 Q 68 4, 76 3 Q 72 10, 64 12" fill="currentColor" fillOpacity="0.5" />
        <path d="M80 13 Q 83 19, 90 20 Q 88 14, 80 13" fill="currentColor" fillOpacity="0.5" />
        {/* right branch */}
        <path d="M206 14 Q 165 10, 124 14" />
        <path d="M190 14 Q 186 6, 178 5 Q 182 12, 190 14" fill="currentColor" fillOpacity="0.5" />
        <path d="M172 13 Q 170 20, 162 22 Q 164 14, 172 13" fill="currentColor" fillOpacity="0.5" />
        <path d="M156 12 Q 152 4, 144 3 Q 148 10, 156 12" fill="currentColor" fillOpacity="0.5" />
        <path d="M140 13 Q 137 19, 130 20 Q 132 14, 140 13" fill="currentColor" fillOpacity="0.5" />
      </g>
      {/* center diamond */}
      <rect
        x="106.5"
        y="10.5"
        width="7"
        height="7"
        transform="rotate(45 110 14)"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** Thin rule with a centered diamond, used between sections. */
export function RuleDiamond({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`} aria-hidden="true">
      <span className="h-px flex-1 bg-brass/35" />
      <span className="block size-1.5 rotate-45 border border-brass/60" />
      <span className="h-px flex-1 bg-brass/35" />
    </div>
  );
}
