import { fmt } from "@/lib/model";
import { Icon } from "./icon";
import type { GlyphName } from "@/lib/glyphs";

export type Kpi = {
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "warn" | "bad";
  icon?: GlyphName;
};

const TONE = { good: "var(--pos)", bad: "var(--neg)", warn: "var(--warn)" } as const;

/**
 * Metric row, per the supplied style guide: a tinted well carrying the icon,
 * label and value, with the qualifying caption beneath it on the card ground.
 */
export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <section className="panel">
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((k) => (
          <div key={k.label} className="flex flex-col gap-2">
            <div className="well flex flex-col gap-1 px-3 py-2.5">
              <span className="flex min-h-[20px] items-start gap-2 text-[13px] font-medium leading-5 text-muted-foreground">
                {k.icon && <Icon name={k.icon} size={15} className="mt-[2px] shrink-0 opacity-70" />}
                <span className="leading-5">{k.label}</span>
              </span>
              <span className="value" style={k.tone ? { color: TONE[k.tone] } : undefined}>
                {k.value}
              </span>
            </div>
            <span className="px-1 text-[13px] leading-5 text-muted-foreground">{k.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
export { fmt };
