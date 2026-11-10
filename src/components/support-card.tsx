"use client";

import { useState } from "react";
import { COFFEE_OPTIONS, COFFEE_PRICE_CENTS, NAME_MAX, NOTE_MAX, creator, formatUSD } from "@/lib/config";
import { CupIcon } from "./cup-icon";
import { Tasa, type TasaMood } from "./tasa";

const STEAM_FOR: Record<number, 1 | 2 | 3> = { 1: 1, 3: 2, 5: 3 };
const DEFAULT_COFFEES = 3;

/**
 * A plain <form method="post">: it works without JavaScript.
 * JS only adds Tasa's reactions and the live note counter.
 * The total on the button switches with CSS :has(), so it is right without JS too.
 */
export function SupportCard() {
  const [coffees, setCoffees] = useState<number>(DEFAULT_COFFEES);
  const [noteLength, setNoteLength] = useState(0);
  const [hopKey, setHopKey] = useState(0);
  const [wiggleKey, setWiggleKey] = useState(0);
  const [mood, setMood] = useState<TasaMood>("idle");

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -top-[86px] right-6 z-10 sm:right-8">
        <Tasa mood={mood} size={104} steam={STEAM_FOR[coffees]} hopKey={hopKey} wiggleKey={wiggleKey} />
      </div>

      <form
        method="post"
        action="/api/checkout"
        className="support-form card relative p-6 sm:p-8"
        onSubmit={() => setMood("happy")}
        aria-labelledby="support-title"
      >
        <h2 id="support-title" className="pr-28 text-xl font-semibold sm:text-2xl">
          Buy {creator.firstName} a <span className="font-serif font-normal italic">coffee</span>
        </h2>
        <p className="mt-1 text-sm text-muted">{formatUSD(COFFEE_PRICE_CENTS)} each. One-time, no account needed.</p>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">How many coffees?</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CupIcon className="size-7 text-roast" />
            <span aria-hidden="true" className="mr-1 text-muted">×</span>
            {COFFEE_OPTIONS.map((n) => (
              <label key={n} className="relative">
                <input
                  type="radio"
                  name="coffees"
                  value={n}
                  defaultChecked={n === DEFAULT_COFFEES}
                  className="peer sr-only"
                  onChange={() => {
                    setCoffees(n);
                    if (n === 5) setHopKey((k) => k + 1);
                  }}
                />
                <span className="chip grid size-12 cursor-pointer place-items-center rounded-full border border-line bg-paper text-lg font-semibold transition-colors peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-milk peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-crema hover:border-roast">
                  {n}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor="support-name" className="text-sm font-medium">
            Your name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="support-name"
            name="name"
            maxLength={NAME_MAX}
            autoComplete="nickname"
            placeholder="Juan, or leave blank"
            className="field mt-1.5"
            onFocus={() => setWiggleKey((k) => k + 1)}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="support-note" className="text-sm font-medium">
            Leave a note <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="support-note"
            name="note"
            rows={3}
            maxLength={NOTE_MAX}
            placeholder="Say something nice…"
            aria-describedby="note-count"
            className="field mt-1.5 resize-none"
            onChange={(e) => setNoteLength(e.currentTarget.value.length)}
          />
          <p id="note-count" className="mt-1 text-right text-xs text-muted">
            {noteLength} / {NOTE_MAX}
          </p>
        </div>

        <label className="mt-2 flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm">Keep my name and note private</span>
          <span className="relative inline-flex shrink-0">
            <input type="checkbox" name="private" className="peer sr-only" />
            <span className="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-roast peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-crema" />
            <span className="absolute top-1 left-1 size-5 rounded-full bg-milk shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        <button type="submit" className="btn btn-primary mt-6 w-full py-4 text-base">
          Support with{" "}
          {COFFEE_OPTIONS.map((n) => (
            <span key={n} className="support-total" data-for={n}>
              {formatUSD(n * COFFEE_PRICE_CENTS)}
            </span>
          ))}
        </button>
      </form>
    </div>
  );
}
