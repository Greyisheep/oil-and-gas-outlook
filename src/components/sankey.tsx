import { GAS_NODES, GAS_LINKS, type GasNode } from "@/lib/gas-balance";

/* Geometry. One column per stage, node height proportional to volume. */
const W = 1000, H = 470;
const PAD_T = 38, PAD_B = 22;          // top pad leaves room for the source label
const NODE_W = 11;
const GAP = 16;                        // vertical gap between sibling nodes
// Columns sit well inside the viewBox so the right-hand labels have room:
// col 2 labels start at 711 and the longest runs to ~850, clear of W.
const COL_X = [96, 430, 700];

type Placed = GasNode & { x: number; y: number; h: number };

function layout(): { placed: Map<string, Placed>; ribbons: Ribbon[] } {
  const usable = H - PAD_T - PAD_B;

  // Scale from the tallest column, so nothing overflows.
  const colTotals = [0, 1, 2].map((c) => {
    const ns = GAS_NODES.filter((n) => n.col === c);
    return { sum: ns.reduce((a, n) => a + n.value, 0), count: ns.length };
  });
  const k = Math.min(
    ...colTotals.map((t) => (usable - GAP * Math.max(0, t.count - 1)) / t.sum),
  );

  const placed = new Map<string, Placed>();

  // Column 0 and 1 start at the top; column 2 hangs off its parent so the
  // domestic branch reads as a fan rather than a floating stack.
  for (const col of [0, 1]) {
    let y = PAD_T;
    for (const n of GAS_NODES.filter((n) => n.col === col)) {
      const h = n.value * k;
      placed.set(n.id, { ...n, x: COL_X[col], y, h });
      y += h + GAP;
    }
  }
  const parent = placed.get("domestic")!;
  const kids = GAS_NODES.filter((n) => n.col === 2);
  const kidsH = kids.reduce((a, n) => a + n.value * k, 0) + GAP * (kids.length - 1);
  let y2 = parent.y + parent.h / 2 - kidsH / 2;
  for (const n of kids) {
    const h = n.value * k;
    placed.set(n.id, { ...n, x: COL_X[2], y: y2, h });
    y2 += h + GAP;
  }

  // Ribbons, stacked in node order on both ends so they never cross.
  const outAt = new Map<string, number>();
  const inAt = new Map<string, number>();
  const ribbons: Ribbon[] = GAS_LINKS.map((l) => {
    const s = placed.get(l.from)!, t = placed.get(l.to)!;
    const th = l.value * k;
    const so = outAt.get(l.from) ?? 0;
    const to = inAt.get(l.to) ?? 0;
    outAt.set(l.from, so + th);
    inAt.set(l.to, to + th);
    return {
      id: `${l.from}-${l.to}`, from: l.from, to: l.to, value: l.value,
      color: t.color,
      x1: s.x + NODE_W, y1: s.y + so,
      x2: t.x, y2: t.y + to,
      h: th,
    };
  });

  return { placed, ribbons };
}

type Ribbon = {
  id: string; from: string; to: string; value: number; color: string;
  x1: number; y1: number; x2: number; y2: number; h: number;
};

/** Bezier band from one node edge to another. */
function band(r: Ribbon) {
  const mx = (r.x1 + r.x2) / 2;
  const { x1, x2, y1, y2, h } = r;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}
          L ${x2},${y2 + h} C ${mx},${y2 + h} ${mx},${y1 + h} ${x1},${y1 + h} Z`;
}

const f = (v: number) => v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

const label = new Map(GAS_NODES.map((n) => [n.id, n.label]));

/**
 * Highlighting is pure CSS: hovering a ribbon lifts it and fades the rest,
 * so it works without client JS and the whole diagram renders on the server.
 * Each ribbon and node carries a <title> for the native tooltip and for
 * screen readers.
 */
export function GasSankey() {
  const { placed, ribbons } = layout();

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[470px] w-full min-w-[820px]"
        role="img"
        aria-label="Sankey diagram of Nigeria's 2025 gas balance, from gross production through export, domestic market, field operations and flaring, with the domestic branch split by sector"
      >
        {/* ribbons under nodes */}
        <g className="ribbons">
          {ribbons.map((r) => (
            <path key={r.id} className="ribbon" d={band(r)} fill={r.color}>
              <title>
                {label.get(r.from)} to {label.get(r.to)}: {f(r.value)} bscf/d
              </title>
            </path>
          ))}
        </g>

        {[...placed.values()].map((n) => {
          const right = n.col === 2;
          const tx = right ? n.x + NODE_W + 10 : n.x - 10;
          const anchor = right ? "start" : "end";
          // The single source node labels above its own bar; everything else
          // sits beside it, so no text ever lands on top of a ribbon.
          const source = n.col === 0;
          return (
            <g key={n.id}>
              <rect
                x={n.x} y={n.y} width={NODE_W} height={Math.max(n.h, 1.5)}
                rx={2.5} fill={n.color}
              >
                <title>{n.label}: {f(n.value)} bscf/d{n.note ? ` (${n.note})` : ""}</title>
              </rect>
              <text
                x={source ? n.x : tx}
                y={source ? n.y - 22 : n.y + n.h / 2 - 8}
                textAnchor={source ? "start" : anchor}
                dominantBaseline="middle"
                className="fill-[var(--foreground)]"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {n.label}
              </text>
              <text
                x={source ? n.x : tx}
                y={source ? n.y - 6 : n.y + n.h / 2 + 9}
                textAnchor={source ? "start" : anchor}
                dominantBaseline="middle"
                className="fill-[var(--muted-foreground)]"
                style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
              >
                {f(n.value)} bscf/d
                {n.note && <tspan className="fill-[var(--lighter)]"> · {n.note}</tspan>}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
