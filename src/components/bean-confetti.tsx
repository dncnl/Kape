/** CSS-only coffee-bean burst. Every bean finishes within 1.5s; hidden under reduced motion. */
const BEANS = Array.from({ length: 22 }, (_, i) => {
  // Deterministic pseudo-random spread so server and client markup match.
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const delay = Math.floor(r(1) * 35) / 100; // 0–0.34s
  // delay + duration ≤ 0.8 + 0.7 = 1.5s for every bean.
  const dur = Math.floor((0.8 + r(3) * (0.7 - delay)) * 100) / 100;
  return {
    left: `${4 + r(2) * 92}%`,
    delay: `${delay}s`,
    dur: `${dur}s`,
    drift: `${Math.round((r(4) - 0.5) * 120)}px`,
    spin: `${Math.round(180 + r(5) * 360)}deg`,
    scale: 0.7 + r(6) * 0.6,
  };
});

export function BeanConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {BEANS.map((b, i) => (
        <span
          key={i}
          className="bean"
          style={
            {
              left: b.left,
              scale: b.scale,
              "--delay": b.delay,
              "--dur": b.dur,
              "--drift": b.drift,
              "--spin": b.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
