import Link from "next/link";
import { Tasa } from "./tasa";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link
        href="/"
        className="group inline-flex items-center gap-2 rounded-full pr-2"
        aria-label="Kape home"
      >
        <Tasa size={34} steam={1} />
        <span className="font-serif text-3xl leading-none italic">Kape</span>
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
        <Link
          href="/#support"
          className="rounded-full px-3 py-2 text-muted transition-colors hover:text-espresso"
        >
          Support
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-line bg-milk px-4 py-2 transition-colors hover:border-roast"
        >
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
