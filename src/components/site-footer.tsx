import { site } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-xl">{site.footer}</p>
        <p>
          Made with <span className="font-serif text-base text-roast italic">kape</span> in Pampanga
        </p>
      </div>
    </footer>
  );
}
