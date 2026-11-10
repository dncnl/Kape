/** Tiny decorative cup, used where an emoji would render inconsistently. */
export function CupIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className={className}>
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H16.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7.5h13l-1 9.5a3 3 0 0 1-3 2.6H8A3 3 0 0 1 5 17L4 7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 2.5c-.8.8.8 1.6 0 2.6M12 2.5c-.8.8.8 1.6 0 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
