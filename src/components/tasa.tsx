/**
 * Tasa (Filipino for "cup"), Kape's mascot.
 * Decorative everywhere: always aria-hidden. All motion is CSS and stops under
 * prefers-reduced-motion (see globals.css).
 */

export type TasaMood = "idle" | "happy" | "sleepy";

type Props = {
  mood?: TasaMood;
  size?: number;
  /** Steam curls 0–3. Defaults: idle 2, happy 3, sleepy 0. */
  steam?: 0 | 1 | 2 | 3;
  /** Change this number to replay the happy hop. 0 = no hop. */
  hopKey?: number;
  /** Change this number to replay the listening wiggle. 0 = no wiggle. */
  wiggleKey?: number;
  className?: string;
};

const INK = "#1B1410";
const ROAST = "#5A3A26";
const CREMA = "#C8834A";
const BLUSH = "#F2A28A";
const CUP = "#FFF8EE";
const SHADOW = "#E9DFD2";

const STEAM_PATHS: Record<1 | 2 | 3, { d: string; opacity: number }[]> = {
  1: [{ d: "M78 38c-8-7 6-13-2-22", opacity: 1 }],
  2: [
    { d: "M72 38c-8-7 6-13-2-22", opacity: 1 },
    { d: "M88 40c-6-6 5-10 0-16", opacity: 0.5 },
  ],
  3: [
    { d: "M66 36c-8-7 6-13-2-22", opacity: 1 },
    { d: "M80 34c-8-7 6-13-2-22", opacity: 0.8 },
    { d: "M94 36c-8-7 6-13-2-22", opacity: 0.6 },
  ],
};

const DEFAULT_STEAM: Record<TasaMood, 0 | 1 | 2 | 3> = { idle: 2, happy: 3, sleepy: 0 };

function Face({ mood }: { mood: TasaMood }) {
  if (mood === "happy") {
    return (
      <>
        <g stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none">
          <path d="M56 90c3-6 9-6 12 0" />
          <path d="M88 90c3-6 9-6 12 0" />
        </g>
        <ellipse cx="52" cy="101" rx="7.5" ry="4.5" fill={BLUSH} opacity={0.9} />
        <ellipse cx="104" cy="101" rx="7.5" ry="4.5" fill={BLUSH} opacity={0.9} />
        <path d="M68 99c3 9 17 9 20 0Z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      </>
    );
  }

  if (mood === "sleepy") {
    return (
      <>
        <g stroke={INK} strokeWidth={3.5} strokeLinecap="round">
          <path d="M56 89h12" />
          <path d="M88 89h12" />
        </g>
        <ellipse cx="52" cy="101" rx="7" ry="4" fill={BLUSH} opacity={0.5} />
        <ellipse cx="104" cy="101" rx="7" ry="4" fill={BLUSH} opacity={0.5} />
        <path d="M74 101h8" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      </>
    );
  }

  return (
    <>
      <g className="tasa-eyes">
        <ellipse cx="62" cy="88" rx="4.5" ry="6" fill={INK} />
        <ellipse cx="94" cy="88" rx="4.5" ry="6" fill={INK} />
        <circle cx="63.5" cy="86" r="1.5" fill="#fff" />
        <circle cx="95.5" cy="86" r="1.5" fill="#fff" />
      </g>
      <ellipse cx="52" cy="101" rx="7" ry="4" fill={BLUSH} opacity={0.7} />
      <ellipse cx="104" cy="101" rx="7" ry="4" fill={BLUSH} opacity={0.7} />
      <path d="M71 100c4 5 10 5 14 0" stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </>
  );
}

export function Tasa({
  mood = "idle",
  size = 160,
  steam,
  hopKey = 0,
  wiggleKey = 0,
  className = "",
}: Props) {
  const curls = mood === "sleepy" ? 0 : (steam ?? DEFAULT_STEAM[mood]);

  return (
    <span
      aria-hidden="true"
      className={`tasa inline-block shrink-0 select-none ${className}`}
      data-mood={mood}
      style={{ width: size, height: size }}
    >
      <span key={`hop-${hopKey}`} className={hopKey ? "tasa-hop" : "inline-block"}>
        <span key={`wiggle-${wiggleKey}`} className={wiggleKey ? "tasa-wiggle" : "inline-block"}>
          <svg
            viewBox="0 0 160 160"
            width={size}
            height={size}
            fill="none"
            focusable="false"
            className="block overflow-visible"
          >
            {/* Ground shadow stays put while Tasa breathes. */}
            <ellipse cx="78" cy="140" rx="48" ry="7" fill={SHADOW} />

            <g className="tasa-body">
              {curls > 0 && (
                <g
                  className="tasa-steam"
                  stroke={INK}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {STEAM_PATHS[curls as 1 | 2 | 3].map((p) => (
                    <path
                      key={p.d}
                      d={p.d}
                      opacity={p.opacity}
                      style={{ "--steam-opacity": p.opacity } as React.CSSProperties}
                    />
                  ))}
                </g>
              )}

              <g stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M120 74h6a14 14 0 0 1 0 28h-9" />
                <path d="M34 56h88l-6 58a22 22 0 0 1-22 20H62a22 22 0 0 1-22-20L34 56Z" fill={CUP} />
                <ellipse cx="78" cy="56" rx="44" ry="9" fill={ROAST} />
              </g>
              <ellipse cx="66" cy="54" rx="12" ry="2.6" fill={CREMA} opacity={0.8} />

              <Face mood={mood} />
            </g>

            {mood === "happy" && (
              <path
                className="tasa-sparkle"
                d="M126 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"
                fill={CREMA}
              />
            )}

            {mood === "sleepy" && (
              <g
                fill={ROAST}
                style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
              >
                <text className="tasa-z" x="118" y="44" fontSize="22">
                  z
                </text>
                <text className="tasa-z" x="134" y="26" fontSize="16">
                  z
                </text>
              </g>
            )}
          </svg>
        </span>
      </span>
    </span>
  );
}
