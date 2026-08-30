import {
  NG_DELTA_PATH, NG_LOCATOR_PATH, LOCATOR_FRAME, MAP_BOX, LOCATOR_BOX,
  GRATICULE, SCALE, TERMINALS, UNMAPPED, MAP_FACTS,
} from "@/lib/terminals";

/* Area, not radius, carries the value. */
const R_MAX = 26;
const V_MAX = Math.max(...TERMINALS.map((t) => t.kbpd));
const r = (v: number) => R_MAX * Math.sqrt(v / V_MAX);

/* Label side, set by hand: the four sit in two tight pairs. */
const SIDE: Record<string, "left" | "right"> = {
  Escravos: "left", Forcados: "right", Bonny: "left", "Qua Iboe": "right",
};

const LEGEND = [300, 150, 50];

/**
 * The terminals are tanker loading points, so the map is drawn as a chart:
 * a graticule at whole degrees, a scale bar measured off the projection, a
 * soft coastal halo in the manner of an engraved chart, and distance rings
 * that show the offshore moorings at their true stand-off from shore.
 */
export function TerminalMap() {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${MAP_BOX.w} ${MAP_BOX.h}`}
        className="h-[470px] w-full min-w-[640px]"
        role="img"
        aria-label="Nautical-style chart of the Niger Delta showing crude export terminals sized by July 2026 throughput: Forcados 322, Bonny 304, Qua Iboe 158 and Escravos 131 thousand barrels a day"
      >
        <defs>
          {/* water, deepening away from the coast */}
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.05} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.11} />
          </linearGradient>
          <radialGradient id="port" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.2} />
          </radialGradient>
          {/* land is clipped out of the halo so the glow only falls seaward */}
          <clipPath id="seaOnly">
            <path d={`M0,0 H${MAP_BOX.w} V${MAP_BOX.h} H0 Z ${NG_DELTA_PATH}`} clipRule="evenodd" />
          </clipPath>
        </defs>

        <rect x={0} y={0} width={MAP_BOX.w} height={MAP_BOX.h} fill="url(#sea)" />

        {/* graticule, genuinely at whole degrees of the projection */}
        <g stroke="var(--muted-foreground)" strokeOpacity={0.13} strokeWidth={0.8}>
          {GRATICULE.lon.map((g) => (
            <line key={`x${g.deg}`} x1={g.x} y1={0} x2={g.x} y2={MAP_BOX.h} strokeDasharray="2 5" />
          ))}
          {GRATICULE.lat.map((g) => (
            <line key={`y${g.deg}`} x1={0} y1={g.y} x2={MAP_BOX.w} y2={g.y} strokeDasharray="2 5" />
          ))}
        </g>
        <g className="fill-[var(--lighter)]" style={{ fontSize: 10 }}>
          {GRATICULE.lon.map((g) => (
            <text key={`xl${g.deg}`} x={g.x + 3} y={MAP_BOX.h - 6}>{g.deg}°E</text>
          ))}
          {GRATICULE.lat.map((g) => (
            <text key={`yl${g.deg}`} x={4} y={g.y - 4}>{g.deg}°N</text>
          ))}
        </g>

        {/* coastal halo: successively wider strokes, clipped to the water */}
        <g clipPath="url(#seaOnly)">
          {[
            { w: 22, o: 0.05 }, { w: 14, o: 0.06 },
            { w: 8, o: 0.07 }, { w: 3.5, o: 0.09 },
          ].map((h) => (
            <path key={h.w} d={NG_DELTA_PATH} fill="none"
                  stroke="var(--chart-4)" strokeOpacity={h.o} strokeWidth={h.w} />
          ))}
        </g>

        <path d={NG_DELTA_PATH} fill="var(--card)"
              stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeWidth={1.1} />

        {/* stand-off rings: the real distance these moorings sit from shore */}
        {TERMINALS.filter((t) => t.offshoreR).map((t) => (
          <g key={`ring-${t.name}`}>
            <circle cx={t.x} cy={t.y} r={t.offshoreR} fill="none"
                    stroke="var(--chart-4)" strokeOpacity={0.28}
                    strokeWidth={0.9} strokeDasharray="3 4" />
          </g>
        ))}

        {TERMINALS.map((t) => {
          const right = SIDE[t.name] === "right";
          const rad = r(t.kbpd);
          const lx = right ? t.x + rad + 10 : t.x - rad - 10;
          return (
            <g key={t.name}>
              <circle cx={t.x} cy={t.y} r={rad} fill="url(#port)"
                      stroke="var(--chart-1)" strokeWidth={1.6}>
                <title>
                  {t.name}: {t.kbpd} thousand barrels a day. {t.where}.
                </title>
              </circle>
              <circle cx={t.x} cy={t.y} r={2.4} fill="var(--chart-1)" />
              <text x={lx} y={t.y - 4} textAnchor={right ? "start" : "end"}
                    className="fill-[var(--foreground)]" style={{ fontSize: 14, fontWeight: 500 }}>
                {t.name}
              </text>
              <text x={lx} y={t.y + 13} textAnchor={right ? "start" : "end"}
                    className="fill-[var(--muted-foreground)]"
                    style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                {t.kbpd.toFixed(0)} kb/d
              </text>
            </g>
          );
        })}

        {/* scale bar, measured off the projection, in km and nautical miles */}
        <g transform={`translate(28, ${MAP_BOX.h - 122})`}>
          <line x1={0} y1={0} x2={SCALE.barUnits} y2={0}
                stroke="var(--muted-foreground)" strokeWidth={1.4} />
          {[0, SCALE.barUnits / 2, SCALE.barUnits].map((x, i) => (
            <line key={i} x1={x} y1={-4} x2={x} y2={4}
                  stroke="var(--muted-foreground)" strokeWidth={1.4} />
          ))}
          <rect x={0} y={-3} width={SCALE.barUnits / 2} height={6}
                fill="var(--muted-foreground)" fillOpacity={0.5} />
          <text x={0} y={18} className="fill-[var(--lighter)]" style={{ fontSize: 11 }}>0</text>
          <text x={SCALE.barUnits} y={18} textAnchor="end" className="fill-[var(--lighter)]"
                style={{ fontSize: 11 }}>
            {SCALE.barKm} km · {SCALE.barNm} nm
          </text>
        </g>

        {/* size key */}
        <g transform={`translate(28, ${MAP_BOX.h - 34})`}>
          <text x={0} y={-R_MAX - 10} className="fill-[var(--lighter)]" style={{ fontSize: 11 }}>
            Circle area = barrels a day
          </text>
          {LEGEND.map((v, i) => {
            const rr = r(v);
            const cx = LEGEND.slice(0, i).reduce((a, p) => a + r(p) * 2 + 13, rr);
            return (
              <g key={v}>
                <circle cx={cx} cy={-rr} r={rr} fill="none"
                        stroke="var(--muted-foreground)" strokeWidth={1} strokeOpacity={0.5} />
                <text x={cx} y={12} textAnchor="middle" className="fill-[var(--lighter)]"
                      style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{v}</text>
              </g>
            );
          })}
        </g>

        {/* north arrow */}
        <g transform={`translate(${MAP_BOX.w - 30}, ${MAP_BOX.h - 42})`}>
          <path d="M0,-15 L5,4 L0,0 L-5,4 Z" fill="var(--muted-foreground)" fillOpacity={0.65} />
          <text x={0} y={17} textAnchor="middle" className="fill-[var(--lighter)]"
                style={{ fontSize: 10, letterSpacing: "0.08em" }}>N</text>
        </g>

        {/* locator */}
        <g transform={`translate(${MAP_BOX.w - LOCATOR_BOX.w - 14}, 14)`}>
          <rect x={-2} y={-2} width={LOCATOR_BOX.w + 4} height={LOCATOR_BOX.h + 4} rx={6}
                fill="var(--card)" fillOpacity={0.82} />
          <path d={NG_LOCATOR_PATH} fill="var(--plot)"
                stroke="var(--muted-foreground)" strokeOpacity={0.42} strokeWidth={1} />
          <rect x={LOCATOR_FRAME.x} y={LOCATOR_FRAME.y}
                width={LOCATOR_FRAME.w} height={LOCATOR_FRAME.h}
                fill="var(--chart-1)" fillOpacity={0.2}
                stroke="var(--chart-1)" strokeWidth={1.2} rx={2} />
        </g>
      </svg>

      {/* The protagonist is concentration, so the ranking gets the weight. */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 px-4 pb-2 pt-3">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[38px] font-semibold leading-none tracking-[-1px] tabular-nums">
              {MAP_FACTS.mappedShare}%
            </span>
          </div>
          <p className="body mt-1 max-w-[24ch]">
            of Nigeria&rsquo;s crude leaves through these four points
          </p>
        </div>

        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          {[...TERMINALS].sort((a, b) => b.kbpd - a.kbpd).map((t) => {
            const share = (t.kbpd / MAP_FACTS.nationalCrude) * 100;
            return (
              <div key={t.name} className="flex items-center gap-2.5">
                <span className="w-[62px] shrink-0 text-[12.5px]">{t.name}</span>
                <div className="h-[7px] flex-1 rounded-full bg-[var(--track)]">
                  <div className="h-[7px] rounded-full"
                       style={{ width: `${(share / 25) * 100}%`, background: "var(--chart-1)", opacity: 0.85 }} />
                </div>
                <span className="w-[86px] shrink-0 text-right text-[12.5px] tabular-nums text-[var(--muted-foreground)]">
                  {share.toFixed(1)}% · 1 in {(MAP_FACTS.nationalCrude / t.kbpd).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t-[0.8px] border-[var(--rule)] px-4 pb-3 pt-2.5">
        <span className="caption">The rest</span>
        {UNMAPPED.map((u) => (
          <span key={u.name} className="text-[12.5px]">
            {u.name} <span className="tabular-nums text-[var(--muted-foreground)]">{u.kbpd} kb/d</span>
            <span className="text-[var(--fade)]"> · {u.why}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
