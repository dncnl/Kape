import { Suspense } from "react";
import { GoalCard } from "@/components/goal-card";
import { Memberships } from "@/components/memberships";
import { Notice } from "@/components/notice";
import { PaymentsNapping } from "@/components/payments-napping";
import { RecentRolls } from "@/components/recent-rolls";
import { SupportCard } from "@/components/support-card";
import { SupporterWall } from "@/components/supporter-wall";
import { creator } from "@/lib/config";
import { loadCreatorData } from "@/lib/data";
import { safeExternalUrl } from "@/lib/format";
import { goalProgress } from "@/lib/stats";
import { toWall } from "@/lib/supporters";

// Rebuilt at most once a minute; the Stripe webhook refreshes it right after each payment.
export const revalidate = 60;

export default async function CreatorPage() {
  const data = await loadCreatorData();
  const live = data.mode === "live";
  const loomUrl = safeExternalUrl(process.env.LOOM_URL);
  const goal = goalProgress(data.supports, creator.goal.targetCents);
  const wall = toWall(data.supports, 20);

  return (
    <>
      <Suspense fallback={null}>
        <Notice />
      </Suspense>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14 lg:pt-14">
        <div className="min-w-0 space-y-10">
          <div className="fade-up">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-full bg-roast font-serif text-2xl text-milk italic ring-4 ring-milk"
              >
                {creator.initials}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{creator.name}</p>
                <p className="text-sm text-muted">
                  {creator.role} · {creator.location}
                </p>
              </div>
            </div>

            <h1 className="mt-8 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.02] font-semibold tracking-tight">
              {creator.headline.sans}{" "}
              <span className="block font-serif font-normal text-roast italic">
                {creator.headline.serif}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{creator.bio}</p>
          </div>

          <div className="fade-up" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <GoalCard raisedCents={goal.raisedCents} ratio={goal.ratio} />
          </div>
        </div>

        <aside
          id="support"
          aria-label="Support Mara"
          className={`fade-up min-w-0 scroll-mt-8 lg:sticky lg:top-6 lg:self-start ${live ? "pt-20" : "lg:pt-20"}`}
          style={{ "--delay": "200ms" } as React.CSSProperties}
        >
          {live ? <SupportCard /> : <PaymentsNapping loomUrl={loomUrl} />}
        </aside>
      </div>

      <div className="space-y-24">
        <RecentRolls />
        <Memberships live={live} loomUrl={loomUrl} />
        <SupporterWall entries={wall} now={data.now} />
      </div>
    </>
  );
}
