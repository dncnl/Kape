import { Tasa } from "@/components/tasa";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-10 px-4 py-16">
      <Tasa mood="idle" />
      <Tasa mood="happy" />
      <Tasa mood="sleepy" />
    </div>
  );
}
