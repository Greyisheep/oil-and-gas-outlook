import {
  NG_DELTA_PATH, NG_LOCATOR_PATH, LOCATOR_FRAME, MAP_BOX, LOCATOR_BOX,
  TERMINALS, UNMAPPED, MAP_FACTS,
} from "@/lib/terminals";

/* Area, not radius, carries the value: a terminal twice the size gets twice
   the ink, which is the only scaling a reader interprets correctly. */
const R_MAX = 28;
const V_MAX = Math.max(...TERMINALS.map((t) => t.kbpd));
const r = (v: number) => R_MAX * Math.sqrt(v / V_MAX);

/* Label side per terminal, set by hand: the four sit in two tight pairs and
   an automatic rule would put two labels on top of each other. */
const SIDE: Record<string, "left" | "right"> = {
  Escravos: "left",
  Forcados: "right",
  Bonny: "left",
  "Qua Iboe": "right",
};

const LEGEND = [300, 150, 50];

export function TerminalMap() {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${MAP_BOX.w} ${MAP_BOX.h}`}
        className="h-[470px] w-full min-w-[640px]"
        role="img"
        aria-label="Map of Nigeria's Niger Delta showing crude export terminals sized by July 2026 throughput: Forcados 322, Bonny 304, Qua Iboe 158 and Escravos 131 thousand barrels a day"
      >
        {/* sea behind, land over it, so the coastline reads as an edge */}
        <rect x={0} y={0} width={MAP_BOX.w} height={MAP_BOX.h} fill="var(--plot)" />
        <path d={NG_DELTA_PATH} fill="var(--card)" stroke="var(--muted-foreground)"
              strokeOpacity={0.42} strokeWidth={1.2} />

        {TERMINALS.map((t) => {
          const right = SIDE[t.name] === "right";
          const rad = r(t.kbpd);
          const lx = right ? t.x + rad + 9 : t.x - rad - 9;
          return (
            <g key={t.name}>
              <circle
                cx={t.x} cy={t.y} r={rad}
                fill="var(--chart-1)" fillOpacity={0.32}
                stroke="var(--chart-1)" strokeWidth={1.6}
              >
                <title>{t.name}: {t.kbpd} thousand barrels a day. {t.where}.</title>
              </circle>
              <circle cx={t.x} cy={t.y} r={2} fill="var(--chart-1)" />
              <text
                x={lx} y={t.y - 5}
                textAnchor={right ? "start" : "end"}
                className="fill-[var(--foreground)]"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                {t.name}
              </text>
              <text
                x={lx} y={t.y + 12}
                textAnchor={right ? "start" : "end"}
                className="fill-[var(--muted-foreground)]"
                style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}
              >
                {t.kbpd.toFixed(0)} kb/d
              </text>
            </g>
          );
        })}

        {/* size key */}
        <g transform={`translate(28, ${MAP_BOX.h - 34})`}>
          <text x={0} y={-R_MAX - 12} className="fill-[var(--lighter)]"
                style={{ fontSize: 12 }}>
            Circle area = barrels a day
          </text>
          {LEGEND.map((v, i) => {
            const rr = r(v);
            const cx = LEGEND.slice(0, i).reduce((a, p) => a + r(p) * 2 + 14, rr);
            return (
              <g key={v}>
                <circle cx={cx} cy={-rr} r={rr} fill="none"
                        stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.55} />
                <text x={cx} y={12} textAnchor="middle" className="fill-[var(--lighter)]"
                      style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  {v}
                </text>
              </g>
            );
          })}
        </g>

        {/* locator: where this frame sits in Nigeria */}
        <g transform={`translate(${MAP_BOX.w - LOCATOR_BOX.w - 12}, 12)`}>
          <path d={NG_LOCATOR_PATH} fill="var(--card)" stroke="var(--muted-foreground)"
                strokeOpacity={0.42} strokeWidth={1} />
          <rect
            x={LOCATOR_FRAME.x} y={LOCATOR_FRAME.y}
            width={LOCATOR_FRAME.w} height={LOCATOR_FRAME.h}
            fill="var(--chart-1)" fillOpacity={0.16}
            stroke="var(--chart-1)" strokeWidth={1.2} rx={2}
          />
        </g>
      </svg>

      {/* streams in the same release that are not coastal terminals */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 pb-3 pt-1">
        <span className="caption">Not on the map</span>
        {UNMAPPED.map((u) => (
          <span key={u.name} className="text-[13px]">
            {u.name} <span className="tabular-nums text-[var(--muted-foreground)]">{u.kbpd} kb/d</span>
            <span className="text-[var(--fade)]"> · {u.why}</span>
          </span>
        ))}
        <span className="caption ml-auto tabular-nums">
          Mapped {MAP_FACTS.mappedShare}% of {MAP_FACTS.nationalCrude} kb/d
        </span>
      </div>
    </div>
  );
}
