"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { WISHES, LABEL, TONE, type Status } from "@/lib/watch-wishes";

export function WatchList()  {
  const [open, setOpen] = useState<string | null>(WISHES[0].wish);
  const count = (s: Status) => WISHES.filter((w) => w.status === s).length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-4 pb-3">
        {(["moving", "stalled", "unmeasured"] as Status[]).map((s) => (
          <span key={s} className="text-[13px]">
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: TONE[s] }} />
            <span className="tabular-nums font-medium">{count(s)}</span>{" "}
            <span className="text-[var(--muted-foreground)]">{LABEL[s]}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-[var(--rule)] border-t-[0.8px] border-[var(--rule)]">
        {WISHES.map((w) => {
          const on = open === w.wish;
          return (
            <div key={w.wish}>
              <button
                onClick={() => setOpen(on ? null : w.wish)}
                aria-expanded={on}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--secondary)]/60
                           focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ background: TONE[w.status] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium leading-5">{w.wish}</span>
                  <span className="caption">{w.who} · {w.metric}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-medium tabular-nums" style={{ color: TONE[w.status] }}>
                    {w.reading}
                  </span>
                  <span className="caption">{LABEL[w.status]}</span>
                </span>
                <ChevronDown
                  size={15}
                  className={`mt-[3px] shrink-0 text-[var(--lighter)] transition-transform ${on ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {on && (
                <p className="max-w-[92ch] px-4 pb-3.5 pl-[38px] text-[12.5px] leading-[1.6] text-[var(--muted-foreground)]">
                  {w.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
