import { useId } from "react";

/**
 * Original ornament artwork, hand-authored for this site, rendered in the
 * spirit of carved plaster bas-relief: ivory-and-beige tone-on-tone shapes
 * lifted off the paper by a soft under-shadow and a light catch above.
 * "relief" renders on the ivory sections, "cream" on the dark ones.
 */

type Tone = "relief" | "cream";
type Pt = [number, number];

const LEAF = "M 0 0 C -9 -12 -9 -30 0 -42 C 9 -30 9 -12 0 0 Z";
const PETAL =
  "M 0 0 C -16 -6 -22 -26 -8 -38 C -2 -43 6 -43 12 -36 C 24 -22 14 -4 0 0 Z";

const LEAF_FILLS: Record<Tone, string[]> = {
  relief: ["var(--beige-200)", "var(--beige-100)", "var(--beige-300)"],
  cream: ["var(--cream)", "var(--cream-dim)", "var(--brass)"],
};
const STEM: Record<Tone, string> = {
  relief: "var(--beige-400)",
  cream: "var(--cream-dim)",
};
const DOT: Record<Tone, string> = {
  relief: "var(--beige-400)",
  cream: "var(--cream-dim)",
};
const LEAF_OPACITY: Record<Tone, number> = { relief: 0.9, cream: 0.5 };

/** Dual drop-shadow that makes flat shapes read as carved plaster. */
function ReliefFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow
        dx="0"
        dy="1.6"
        stdDeviation="1.1"
        floodColor="#7d6f55"
        floodOpacity="0.3"
      />
      <feDropShadow
        dx="0"
        dy="-0.7"
        stdDeviation="0.4"
        floodColor="#fffef9"
        floodOpacity="0.9"
      />
    </filter>
  );
}

function Curl({
  x,
  y,
  angle,
  scale = 1,
  tone,
}: {
  x: number;
  y: number;
  angle: number;
  scale?: number;
  tone: Tone;
}) {
  return (
    <path
      d="M 0 0 C 10 -2 18 -8 18 -16 C 18 -22 13 -24 9 -21 C 5 -18 7 -12 12 -12"
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
      fill="none"
      stroke={STEM[tone]}
      strokeOpacity={0.6}
      strokeWidth={1.1}
      strokeLinecap="round"
      pathLength={1}
      className="draw-stem"
    />
  );
}

function q(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}
function qAngle(p0: Pt, p1: Pt, p2: Pt, t: number): number {
  const u = 1 - t;
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** A curved stem with leaves alternating along it, tapering to the tip. */
function Branch({
  p0,
  p1,
  p2,
  leaves = 8,
  size = 1,
  tone,
}: {
  p0: Pt;
  p1: Pt;
  p2: Pt;
  leaves?: number;
  size?: number;
  tone: Tone;
}) {
  const fills = LEAF_FILLS[tone];
  const items = [];
  for (let i = 0; i < leaves; i++) {
    const t = 0.14 + (0.86 * i) / (leaves - 1);
    const [x, y] = q(p0, p1, p2, t);
    const tangent = qAngle(p0, p1, p2, t);
    const side = i % 2 === 0 ? 1 : -1;
    const tip = i === leaves - 1;
    const rot = tip ? tangent + 90 : tangent + 90 + side * 52;
    const s = size * (1.05 - 0.45 * t);
    items.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
        <path
          d={LEAF}
          fill={fills[i % fills.length]}
          fillOpacity={LEAF_OPACITY[tone]}
          stroke={STEM[tone]}
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />
        <path
          d="M 0 -4 L 0 -38"
          stroke={STEM[tone]}
          strokeOpacity={0.45}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>
    );
  }
  const tipAngle = qAngle(p0, p1, p2, 1);
  return (
    <g>
      <path
        d={`M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`}
        fill="none"
        stroke={STEM[tone]}
        strokeOpacity={0.6}
        strokeWidth={1.4}
        strokeLinecap="round"
        pathLength={1}
        className="draw-stem"
      />
      <Curl x={p2[0]} y={p2[1]} angle={tipAngle} scale={size} tone={tone} />
      <g className="draw-leaves">{items}</g>
    </g>
  );
}

/** Layered ivory bloom, carved-plaster style. */
function Bloom3D({
  cx,
  cy,
  r,
  tone = "relief",
}: {
  cx: number;
  cy: number;
  r: number;
  tone?: Tone;
}) {
  const stroke = STEM[tone];
  const ring = (scale: number, angles: number[], fill: string) =>
    angles.map((a) => (
      <path
        key={`${scale}-${a}`}
        d={PETAL}
        transform={`rotate(${a}) scale(${scale})`}
        fill={fill}
        stroke={stroke}
        strokeOpacity={0.45}
        strokeWidth={1.3 / scale}
      />
    ));
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g transform={`scale(${r / 44})`}>
        {ring(1, [0, 60, 120, 180, 240, 300], "var(--beige-100)")}
        {ring(0.62, [30, 100, 170, 240, 310], "#fbf8f0")}
        {ring(0.36, [10, 130, 250], "var(--beige-100)")}
        <circle r={3.6} fill={stroke} fillOpacity={0.6} />
      </g>
    </g>
  );
}

function Dots({
  dots,
  tone = "relief",
}: {
  dots: [number, number, number][];
  tone?: Tone;
}) {
  return (
    <g fill={DOT[tone]}>
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} opacity={0.4 + (i % 3) * 0.18} />
      ))}
    </g>
  );
}

/** Lush corner bouquet for a top corner; mirror with CSS for the other side. */
export function CornerSpray({
  className,
  tone = "relief",
}: {
  className?: string;
  tone?: Tone;
}) {
  const fid = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 340 340" aria-hidden="true" className={className}>
      <defs>{tone === "relief" && <ReliefFilter id={fid} />}</defs>
      <g filter={tone === "relief" ? `url(#${fid})` : undefined}>
        <Branch p0={[55, 40]} p1={[200, 55]} p2={[325, 155]} leaves={9} size={1} tone={tone} />
        <Branch p0={[40, 55]} p1={[75, 205]} p2={[160, 325]} leaves={9} size={1} tone={tone} />
        <Branch p0={[55, 55]} p1={[165, 125]} p2={[265, 255]} leaves={8} size={0.85} tone={tone} />
        <Branch p0={[75, 28]} p1={[160, 14]} p2={[255, 55]} leaves={6} size={0.65} tone={tone} />
        <Branch p0={[28, 75]} p1={[18, 165]} p2={[62, 262]} leaves={6} size={0.65} tone={tone} />
        <Bloom3D cx={100} cy={92} r={44} tone={tone} />
        <Bloom3D cx={52} cy={182} r={30} tone={tone} />
        <Bloom3D cx={182} cy={58} r={24} tone={tone} />
        <Dots
          tone={tone}
          dots={[
            [250, 190, 2.4],
            [285, 140, 1.6],
            [212, 250, 2],
            [265, 235, 1.3],
            [160, 200, 1.4],
            [300, 90, 1.8],
            [120, 285, 1.6],
            [215, 300, 1.2],
            [90, 250, 1.2],
            [310, 200, 1.4],
          ]}
        />
      </g>
    </svg>
  );
}

/** Centered sprig for section headings: mirrored branches + a small bloom. */
export function SmallSpray({
  className,
  tone = "relief",
}: {
  className?: string;
  tone?: Tone;
}) {
  const fid = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 280 70" aria-hidden="true" className={className}>
      <defs>{tone === "relief" && <ReliefFilter id={fid} />}</defs>
      <g filter={tone === "relief" ? `url(#${fid})` : undefined}>
        <Branch p0={[122, 40]} p1={[78, 16]} p2={[16, 34]} leaves={6} size={0.5} tone={tone} />
        <Branch p0={[158, 40]} p1={[202, 16]} p2={[264, 34]} leaves={6} size={0.5} tone={tone} />
        <Bloom3D cx={140} cy={36} r={17} tone={tone} />
        <Dots
          tone={tone}
          dots={[
            [96, 52, 1.2],
            [186, 52, 1.2],
            [58, 20, 1],
            [222, 20, 1],
          ]}
        />
      </g>
    </svg>
  );
}

/**
 * Engraved monogram medallion: double ring, the couple's initials,
 * a leaf pair below — classic old-stationery style.
 */
export function Monogram({
  className,
  initials,
}: {
  className?: string;
  initials: string;
}) {
  const fid = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <defs>
        <ReliefFilter id={fid} />
      </defs>
      <g filter={`url(#${fid})`}>
        <circle
          cx={60}
          cy={60}
          r={55}
          fill="none"
          stroke="var(--beige-400)"
          strokeOpacity={0.8}
          strokeWidth={1.2}
          pathLength={1}
          className="draw-stem"
        />
        <circle
          cx={60}
          cy={60}
          r={49}
          fill="none"
          stroke="var(--beige-300)"
          strokeOpacity={0.8}
          strokeWidth={0.8}
          pathLength={1}
          className="draw-stem"
        />
        <g className="draw-leaves">
          <g transform="translate(48 104) rotate(250) scale(0.34)">
            <path d={LEAF} fill="var(--beige-200)" stroke="var(--beige-400)" strokeWidth={1.6} strokeOpacity={0.5} />
          </g>
          <g transform="translate(72 104) rotate(110) scale(0.34)">
            <path d={LEAF} fill="var(--beige-200)" stroke="var(--beige-400)" strokeWidth={1.6} strokeOpacity={0.5} />
          </g>
          <circle cx={60} cy={16} r={1.6} fill="var(--beige-400)" opacity={0.8} />
        </g>
      </g>
      <text
        x={60}
        y={66}
        textAnchor="middle"
        dominantBaseline="middle"
        className="type-display"
        fontSize={26}
        fill="var(--ink)"
        letterSpacing={2}
      >
        {initials}
      </text>
    </svg>
  );
}

/** Hairline divider with an ivory bloom, leaf pair and flourish ends. */
export function FloralDivider({ className }: { className?: string }) {
  const fid = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 260 48" aria-hidden="true" className={className}>
      <defs>
        <ReliefFilter id={fid} />
      </defs>
      <g filter={`url(#${fid})`}>
        <g stroke="var(--beige-400)" strokeOpacity={0.65} strokeWidth={1}>
          <line x1={16} y1={24} x2={96} y2={24} />
          <line x1={164} y1={24} x2={244} y2={24} />
          <path
            d="M 16 24 C 9 24 5 20 6 16 C 7 13 11 13 12 16 C 13 19 10 21 8 20"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 244 24 C 251 24 255 20 254 16 C 253 13 249 13 248 16 C 247 19 250 21 252 20"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g transform="translate(110 32) rotate(245) scale(0.42)">
          <path d={LEAF} fill="var(--beige-200)" stroke="var(--beige-400)" strokeWidth={1.4} strokeOpacity={0.5} />
        </g>
        <g transform="translate(150 32) rotate(115) scale(0.42)">
          <path d={LEAF} fill="var(--beige-200)" stroke="var(--beige-400)" strokeWidth={1.4} strokeOpacity={0.5} />
        </g>
        <Bloom3D cx={130} cy={24} r={15} />
      </g>
    </svg>
  );
}

/** Tiny ivory bloom used as a timeline node. */
export function Bloom({ className }: { className?: string }) {
  const fid = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <ReliefFilter id={fid} />
      </defs>
      <g filter={`url(#${fid})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx={12}
            cy={7.2}
            rx={3.2}
            ry={4.6}
            transform={`rotate(${a} 12 12)`}
            fill="var(--beige-100)"
            stroke="var(--beige-400)"
            strokeOpacity={0.6}
            strokeWidth={0.9}
          />
        ))}
        <circle cx={12} cy={12} r={2.2} fill="var(--beige-400)" opacity={0.85} />
      </g>
    </svg>
  );
}
