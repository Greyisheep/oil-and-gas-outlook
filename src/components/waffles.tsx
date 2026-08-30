import { SETTLEMENT_FACTS as S, LICENSING as L, FID_WATCH, FID_FACTS, AEB } from "@/lib/watch-data";

/**
 * A hundred coins, filled to the settlement rate. The point of the waffle is
 * that the reader can count it: 42 of 100 is a fact you can check by eye,
 * where "42.52%" is a fact you have to accept.
 */
export function KoboWaffle() {
  // Floor, not round: the waffle is meant to be counted, and 42.52% means
  // 42 whole naira in every hundred arrive. Rounding to 43 would also put
  // this panel out of step with the 42% quoted everywhere else.
  const filled = Math.floor(S.ratePct);
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      <svg
        viewBox="0 0 185 185"
        className="w-full"
        style={{ maxWidth: 310 }}
        role="img"
        aria-label={`Waffle of one hundred coins, ${filled} filled: generators are paid ${S.ratePct} per cent of what they invoice`}
      >
        <defs>
          {/* a struck coin: face, then a rim inside it */}
          {/* Naira mark from Tabler Icons (MIT), drawn at 24 units and scaled
              to sit inside a 14.4px coin. */}
          <g id="nairaMark">
            <path
              d="M7 18V7.052a1.05 1.05 0 0 1 1.968-.51l6.064 10.916a1.05 1.05 0 0 0 1.968-.51V6M5 10h14M5 14h14"
              fill="none" stroke="currentColor" strokeLinecap="round"
              strokeLinejoin="round" strokeWidth="2.6"
            />
          </g>
          <g id="coinOn">
            <circle r="7.2" fill="var(--chart-2)" />
            <g transform="translate(-5.6,-5.6) scale(0.467)" color="var(--card)" opacity={0.92}>
              <use href="#nairaMark" />
            </g>
          </g>
          <g id="coinOff">
            <circle r="7.2" fill="var(--card)" stroke="var(--rule)" strokeWidth="1.2" />
            <g transform="translate(-5.6,-5.6) scale(0.467)" color="var(--rule)">
              <use href="#nairaMark" />
            </g>
          </g>
        </defs>
        {Array.from({ length: 100 }).map((_, i) => (
          <use
            key={i}
            href={i < filled ? "#coinOn" : "#coinOff"}
            x={9 + (i % 10) * 18.4}
            y={9 + Math.floor(i / 10) * 18.4}
          />
        ))}
      </svg>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: "var(--chart-2)" }} />
          Paid <span className="tabular-nums font-medium">₦{S.avgPaid}bn</span>
        </span>
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-[var(--rule)] align-middle bg-[var(--card)]" />
          Unpaid <span className="tabular-nums font-medium">₦{S.shortfallMonthly}bn</span>
        </span>
        <span className="caption ml-auto">One coin per naira in a hundred · {S.ratePct}% monthly average</span>
      </div>
    </div>
  );
}

/**
 * One cell per block on offer. Counting the empty cells is the finding:
 * thirteen blocks nobody bid for, and nothing signed yet.
 */
export function BlockWaffle() {
  const state = (i: number) =>
    i < L.awarded ? "awarded" : "unbid";
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      <div className="grid w-fit grid-cols-10 gap-[6px]">
        {Array.from({ length: L.offered }).map((_, i) => {
          const s = state(i);
          return (
            <span
              key={i}
              className="h-[19px] w-[19px] rounded-[4px]"
              style={
                s === "awarded"
                  ? { background: "var(--chart-1)", opacity: 0.85 }
                  : { background: "var(--track)", boxShadow: "inset 0 0 0 1px var(--rule)" }
              }
              aria-hidden
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-middle" style={{ background: "var(--chart-1)", opacity: 0.85 }} />
          Awarded <span className="tabular-nums font-medium">{L.awarded}</span>
        </span>
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-middle bg-[var(--track)] shadow-[inset_0_0_0_1px_var(--rule)]" />
          No bid <span className="tabular-nums font-medium">{L.offered - L.awarded}</span>
        </span>
      </div>

      {/* the stages, so the pictogram still carries where the round has got to */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t-[0.8px] border-[var(--rule)] pt-3">
        {[
          { label: "Offered", n: L.offered, done: true },
          { label: "Drew a bid", n: L.bidFor, done: true },
          { label: "Awarded", n: L.awarded, done: true },
          { label: "Signed", n: L.executed, done: false },
        ].map((st, i, arr) => (
          <li key={st.label} className="flex items-center gap-2">
            <span className="flex items-baseline gap-1.5">
              <span className="tabular-nums text-[15px] font-semibold"
                    style={{ color: st.done ? "var(--foreground)" : "var(--chart-3)" }}>
                {st.n}
              </span>
              <span className="caption">{st.label}</span>
            </span>
            {i < arr.length - 1 && <span className="text-[var(--fade)]">&rarr;</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Two slots, both empty. The panel wish, as a counter. */
export function FidSlots() {
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      <div className="flex items-center gap-3">
        {Array.from({ length: FID_FACTS.watched }).map((_, i) => (
          <span
            key={i}
            className="flex h-12 w-12 items-center justify-center rounded-[10px] border-[1.5px] border-dashed"
            style={{ borderColor: "var(--rule)" }}
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-[var(--track)]" />
          </span>
        ))}
        <span className="ml-1">
          <span className="value" style={{ color: "var(--chart-3)" }}>{FID_FACTS.taken} of {FID_FACTS.watched}</span>
          <p className="caption">deepwater decisions taken</p>
        </span>
      </div>

      <ol className="flex flex-col gap-2 border-t-[0.8px] border-[var(--rule)] pt-3">
        {FID_WATCH.map((f) => (
          <li key={f.label} className="flex items-baseline gap-2.5">
            <span
              className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
              style={{ background: f.done ? "var(--chart-2)" : "var(--track)",
                       boxShadow: f.done ? "none" : "inset 0 0 0 1px var(--rule)" }}
              aria-hidden
            />
            <span className="w-[60px] shrink-0 text-[12px] tabular-nums text-[var(--lighter)]">{f.date}</span>
            <span className={`text-[13px] ${f.done ? "" : "text-[var(--muted-foreground)]"}`}>{f.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Capital subscribed against capital authorised, plus the slipped dates. */
export function EnergyBank() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      <div className="flex items-baseline justify-between">
        <span className="value">{AEB.subscribedPct}%</span>
        <span className="text-[13px] tabular-nums text-[var(--muted-foreground)]">
          of ${AEB.authorisedBn}bn authorised
        </span>
      </div>
      <div className="h-7 rounded-[6px] bg-[var(--track)]">
        <div className="h-7 rounded-[6px]"
             style={{ width: `${AEB.subscribedPct}%`, background: "var(--chart-1)", opacity: 0.85 }} />
      </div>
      <ol className="flex flex-col gap-1.5 border-t-[0.8px] border-[var(--rule)] pt-2.5">
        {AEB.slips.map((s) => (
          <li key={s.when} className="flex items-baseline gap-2.5">
            <span className="w-[64px] shrink-0 text-[12px] tabular-nums text-[var(--lighter)]">{s.when}</span>
            <span className="text-[13px] text-[var(--muted-foreground)]">{s.what}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
