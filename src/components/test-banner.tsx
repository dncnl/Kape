export function TestBanner() {
  return (
    <div className="border-b border-line bg-espresso px-4 py-1.5 text-center font-mono text-[11px] leading-relaxed tracking-wide text-milk/90 sm:text-xs">
      <span className="text-crema">●</span> Test mode · Stripe sandbox · Card 4242 4242 4242
      4242, any future date, any CVC
    </div>
  );
}
