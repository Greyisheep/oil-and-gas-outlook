import { Car, Truck, Bike, Bus, Store, Warehouse, AlertCircle } from "lucide-react";
import {
  UTILISATION, PCNGI_VEHICLES, PCNGI_STATIONS, PCNGI_TOTAL,
  NETWORK, STORAGE, DANGOTE,
} from "@/lib/downstream";

/**
 * Utilisation as bullet bars rather than a row of gauges. Five gauges is a
 * dashboard cliché and they cannot be compared at a glance; stacked bullets
 * on one shared 0-100 scale can.
 */
export function UtilisationBullets() {
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      {UTILISATION.map((u) => (
        <div key={u.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium">
              {u.label}
              {u.caveat && (
                <AlertCircle size={12} aria-hidden
                  className="ml-1.5 inline-block align-[-1px] text-[var(--chart-1)]" />
              )}
            </span>
            <span className="text-[13px] font-medium tabular-nums">{u.pct}%</span>
          </div>
          <div className="relative h-5 rounded-[5px] bg-[var(--track)]">
            <div className="h-5 rounded-[5px]"
                 style={{ width: `${u.pct}%`, background: "var(--chart-1)", opacity: 0.85 }} />
            {/* idle capacity is the point, so mark the full extent */}
            <div className="absolute bottom-0 top-0 w-[1.5px] bg-[var(--muted-foreground)]"
                 style={{ left: "100%", opacity: 0.4 }} aria-hidden />
          </div>
          <span className="caption">{u.note} · {u.period}</span>
        </div>
      ))}
      <p className="caption border-t-[0.8px] border-[var(--rule)] pt-2.5">
        The marker at the right of each bar is full capacity. The gap to it is plant that exists
        and is not running.
      </p>
    </div>
  );
}

const ICONS = { car: Car, truck: Truck, bike: Bike, bus: Bus };

/** Vehicles converted, one icon per stated unit, scale declared per row. */
export function CngFleet() {
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      {PCNGI_VEHICLES.map((v) => {
        const Icon = ICONS[v.icon];
        const whole = Math.floor(v.count / v.per);
        const part = (v.count % v.per) / v.per;
        return (
          <div key={v.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium">{v.label}</span>
              <span className="text-[13px] tabular-nums">
                {v.count.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[3px]">
              {Array.from({ length: whole }).map((_, i) => (
                <Icon key={i} size={17} strokeWidth={1.8}
                      style={{ color: "var(--chart-1)" }} aria-hidden />
              ))}
              {part > 0.12 && (
                <span className="relative inline-flex" aria-hidden>
                  <Icon size={17} strokeWidth={1.8} style={{ color: "var(--track)" }} />
                  <span className="absolute inset-0 overflow-hidden" style={{ width: `${part * 100}%` }}>
                    <Icon size={17} strokeWidth={1.8} style={{ color: "var(--chart-1)" }} />
                  </span>
                </span>
              )}
            </div>
            <span className="caption">
              one per {v.per.toLocaleString("en-US")}{v.note ? ` · ${v.note}` : ""}
            </span>
          </div>
        );
      })}
      <p className="caption border-t-[0.8px] border-[var(--rule)] pt-2.5 tabular-nums">
        {PCNGI_TOTAL.toLocaleString("en-US")} vehicles converted · ${PCNGI_STATIONS.investmentBn}bn invested
      </p>
    </div>
  );
}

/** Stations built against stations still going up. */
export function CngStations() {
  const total = PCNGI_STATIONS.built + PCNGI_STATIONS.building;
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      <div className="flex flex-wrap gap-[5px]">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="h-[13px] w-[13px] rounded-[3px]"
            style={
              i < PCNGI_STATIONS.built
                ? { background: "var(--chart-2)", opacity: 0.9 }
                : { background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--rule)" }
            }
            aria-hidden
          />
        ))}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-middle"
                style={{ background: "var(--chart-2)", opacity: 0.9 }} />
          Open <span className="tabular-nums font-medium">{PCNGI_STATIONS.built}</span>
        </span>
        <span className="text-[13px]">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] border border-[var(--rule)] bg-[var(--card)] align-middle" />
          Under construction <span className="tabular-nums font-medium">{PCNGI_STATIONS.building}</span>
        </span>
        <span className="caption ml-auto tabular-nums">
          {((PCNGI_STATIONS.built / total) * 100).toFixed(0)}% built · plus {PCNGI_STATIONS.mother} mother stations
        </span>
      </div>
    </div>
  );
}

const NET_ICONS = { store: Store, warehouse: Warehouse, truck: Truck };

/** The physical network the fuel actually moves through. */
export function Network() {
  const maxStore = Math.max(...STORAGE.map((s) => s.bnLitres));
  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      <div className="grid grid-cols-3 gap-3">
        {NETWORK.map((n) => {
          const Icon = NET_ICONS[n.icon];
          return (
            <div key={n.label} className="flex flex-col gap-1">
              <Icon size={15} strokeWidth={1.9} className="text-[var(--muted-foreground)]" aria-hidden />
              <span className="text-[19px] font-semibold leading-tight tabular-nums tracking-[-0.3px]">
                {n.value.toLocaleString("en-US")}
              </span>
              <span className="caption leading-tight">{n.label}</span>
              <span className="caption text-[var(--fade)]">{n.unit}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t-[0.8px] border-[var(--rule)] pt-3">
        <span className="caption">Storage capacity, billion litres</span>
        {STORAGE.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span className="w-[86px] shrink-0 text-[12.5px]">{s.label}</span>
            <div className="h-[7px] flex-1 rounded-full bg-[var(--track)]">
              <div className="h-[7px] rounded-full"
                   style={{ width: `${(s.bnLitres / maxStore) * 100}%`, background: "var(--chart-4)", opacity: 0.8 }} />
            </div>
            <span className="w-[42px] shrink-0 text-right text-[12.5px] tabular-nums text-[var(--muted-foreground)]">
              {s.bnLitres}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dangote against its own plan, at both readings. */
export function DangotePlan() {
  const max = Math.max(DANGOTE.plannedMlPerDay, ...DANGOTE.points.map((p) => p.value)) * 1.08;
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      {DANGOTE.points.map((p) => {
        const pct = (p.value / DANGOTE.plannedMlPerDay) * 100;
        const over = pct >= 100;
        return (
          <div key={p.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium">{p.label}</span>
              <span className="text-[13px] font-medium tabular-nums"
                    style={{ color: over ? "var(--chart-2)" : "var(--chart-3)" }}>
                {pct.toFixed(0)}% of plan
              </span>
            </div>
            <div className="relative h-6 rounded-[5px] bg-[var(--track)]">
              <div className="h-6 rounded-[5px]"
                   style={{ width: `${(p.value / max) * 100}%`,
                            background: over ? "var(--chart-2)" : "var(--chart-3)", opacity: 0.85 }} />
              <div className="absolute bottom-0 top-0 w-[2px] bg-[var(--foreground)]"
                   style={{ left: `${(DANGOTE.plannedMlPerDay / max) * 100}%`, opacity: 0.55 }} aria-hidden />
            </div>
            <span className="caption">{p.value} m litres/day · {p.source}</span>
          </div>
        );
      })}
      <p className="caption border-t-[0.8px] border-[var(--rule)] pt-2.5">
        The dark line is the {DANGOTE.plannedMlPerDay} m litres/day the refinery planned to supply.
        The fact sheet reading is a year old and has been overtaken, so both are shown.
      </p>
    </div>
  );
}
