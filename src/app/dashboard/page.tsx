import type { Metadata } from "next";
import { cookies } from "next/headers";
import { EarningsChart } from "@/components/earnings-chart";
import { Tasa } from "@/components/tasa";
import { DASHBOARD_COOKIE, getDashboardPassword, isAuthorizedCookie } from "@/lib/auth";
import { TIERS, formatUSD } from "@/lib/config";
import { loadCreatorData } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import type { Member, MemberStatus, Support } from "@/lib/supporters";

export const metadata: Metadata = {
  title: "Creator dashboard",
  robots: { index: false },
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  // Read the cookie up front: it also keeps this page per-request (never prerendered).
  const cookie = (await cookies()).get(DASHBOARD_COOKIE)?.value;
  const data = await loadCreatorData();
  const live = data.mode === "live";

  if (live) {
    const password = getDashboardPassword();
    if (!isAuthorizedCookie(cookie, password)) {
      const { login } = await searchParams;
      return <Login configured={password !== null} failed={login === "failed"} />;
    }
  }

  const stats = computeStats(data, data.now);
  const supports = [...data.supports].sort((a, b) => b.createdAt - a.createdAt);
  const members = [...data.members].sort((a, b) => b.createdAt - a.createdAt);

  const tiles = [
    { label: "Lifetime", value: formatUSD(stats.lifetimeCents) },
    { label: "This month", value: formatUSD(stats.monthCents) },
    { label: "Coffees", value: String(stats.coffees) },
    { label: "Active members", value: String(stats.activeMembers) },
    { label: "MRR", value: formatUSD(stats.mrrCents) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 pb-10 sm:px-6">
      <div className="fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Creator dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Good brew, <span className="font-serif font-normal text-roast italic">Mara.</span>
          </h1>
        </div>
        {live ? (
          <form method="post" action="/api/dashboard/logout">
            <button type="submit" className="btn btn-ghost py-2 text-sm">
              Log out
            </button>
          </form>
        ) : (
          <p className="rounded-full border border-line bg-milk px-4 py-2 text-sm text-muted">
            Sample data · explore freely
          </p>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t, i) => (
          <li
            key={t.label}
            className={`card fade-up min-w-0 p-5 ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}
            style={{ "--delay": `${60 * i}ms` } as React.CSSProperties}
          >
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 truncate font-serif text-4xl italic tabular-nums">{t.value}</p>
          </li>
        ))}
      </ul>

      <EarningsChart daily={stats.daily} />

      <section aria-labelledby="supports-title" className="card min-w-0 p-6 sm:p-8">
        <h2 id="supports-title" className="text-lg font-semibold">
          Supports
        </h2>
        {supports.length === 0 ? (
          <Empty text="No coffees yet. Share your page and Tasa will keep watch." />
        ) : (
          <SupportsTable supports={supports} />
        )}
      </section>

      <section aria-labelledby="members-title" className="card min-w-0 p-6 sm:p-8">
        <h2 id="members-title" className="text-lg font-semibold">
          Members
        </h2>
        {members.length === 0 ? (
          <Empty text="No members yet. The first regular is just around the corner." />
        ) : (
          <MembersTable members={members} />
        )}
      </section>
    </div>
  );
}

function Login({ configured, failed }: { configured: boolean; failed: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-10 text-center sm:px-6">
      <Tasa mood="idle" size={120} />
      <h1 className="mt-4 text-3xl font-semibold">
        Creator <span className="font-serif font-normal italic">dashboard</span>
      </h1>
      {configured ? (
        <form method="post" action="/api/dashboard/login" className="card mt-6 w-full p-6 text-left">
          <label htmlFor="dash-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="dash-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field mt-1.5"
            aria-describedby={failed ? "login-error" : undefined}
            aria-invalid={failed || undefined}
          />
          {failed && (
            <p id="login-error" role="alert" className="mt-2 text-sm text-roast">
              That password didn&apos;t match. Try again.
            </p>
          )}
          <button type="submit" className="btn btn-primary mt-4 w-full">
            Open dashboard
          </button>
        </form>
      ) : (
        <p className="card mt-6 p-6 text-muted">
          Live Stripe data is locked. Set <code className="font-mono text-sm">DASHBOARD_PASSWORD</code> to
          sign in.
        </p>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Tasa mood="idle" size={96} />
      <p className="text-muted">{text}</p>
    </div>
  );
}

function Pill({ tone, children }: { tone: "good" | "muted" | "warn"; children: React.ReactNode }) {
  const styles = {
    good: "bg-[#E7F0E4] text-[#2F5A2B] ring-[#C9DEC3]",
    warn: "bg-[#FBEADF] text-[#8A3B12] ring-[#F1CDB6]",
    muted: "bg-paper text-muted ring-line",
  }[tone];
  const dot = { good: "bg-[#3F7A39]", warn: "bg-[#B8541F]", muted: "bg-muted" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

const th = "px-3 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase";
const td = "px-3 py-3 align-top";

function SupportsTable({ supports }: { supports: Support[] }) {
  return (
    <div className="-mx-3 mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={th}>Date</th>
            <th scope="col" className={th}>Supporter</th>
            <th scope="col" className={`${th} text-right`}>Coffees</th>
            <th scope="col" className={`${th} text-right`}>Amount</th>
            <th scope="col" className={th}>Note</th>
            <th scope="col" className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {supports.map((s) => (
            <tr key={s.id} className={s.status === "refunded" ? "text-muted" : undefined}>
              <td className={`${td} whitespace-nowrap`}>{formatDate(s.createdAt)}</td>
              <td className={td}>
                {s.name || <span className="text-muted">Anonymous</span>}
                {s.isPrivate && <span className="ml-2 text-xs text-muted">(private)</span>}
              </td>
              <td className={`${td} text-right tabular-nums`}>{s.coffees}</td>
              <td className={`${td} text-right tabular-nums ${s.status === "refunded" ? "line-through" : ""}`}>
                {formatUSD(s.amountCents)}
              </td>
              <td className={`${td} max-w-xs`}>
                {s.note ? <span className="line-clamp-2 font-serif text-base italic">{s.note}</span> : "–"}
              </td>
              <td className={td}>
                {s.status === "paid" ? <Pill tone="good">Paid</Pill> : <Pill tone="muted">Refunded</Pill>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MEMBER_STATUS: Record<MemberStatus, { label: string; tone: "good" | "muted" | "warn" }> = {
  active: { label: "Active", tone: "good" },
  past_due: { label: "Past due", tone: "warn" },
  canceled: { label: "Canceled", tone: "muted" },
};

function MembersTable({ members }: { members: Member[] }) {
  return (
    <div className="-mx-3 mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className={th}>Member</th>
            <th scope="col" className={th}>Tier</th>
            <th scope="col" className={`${th} text-right`}>Monthly</th>
            <th scope="col" className={th}>Since</th>
            <th scope="col" className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {members.map((m) => {
            const status = MEMBER_STATUS[m.status];
            return (
              <tr key={m.id}>
                <td className={td}>{m.name || <span className="text-muted">Anonymous</span>}</td>
                <td className={td}>{TIERS[m.tier].name}</td>
                <td className={`${td} text-right tabular-nums`}>{formatUSD(m.amountCents)}</td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(m.createdAt)}</td>
                <td className={td}>
                  <Pill tone={status.tone}>{status.label}</Pill>
                  {m.status === "active" && m.cancelAtPeriodEnd && m.currentPeriodEnd && (
                    <span className="mt-1 block text-xs text-muted">Ends {formatDate(m.currentPeriodEnd)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
