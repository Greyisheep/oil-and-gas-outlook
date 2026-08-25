import { GLYPHS, type GlyphName } from "@/lib/glyphs";

/**
 * Renders an open-licensed glyph at a given size, inheriting currentColor so it
 * themes with the rest of the interface. See src/lib/glyphs.ts for attribution.
 */
export function Icon({
  name, size = 20, className = "", title, style,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}) {
  const g = GLYPHS[name];
  return (
    <svg
      viewBox={g.vb}
      width={size}
      height={size}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={g.d} fill="currentColor" />
    </svg>
  );
}

/** Attribution line. CC BY requires credit wherever the icons are shown. */
export function IconCredits({ className = "" }: { className?: string }) {
  return (
    <p className={`source ${className}`}>
      Icons:{" "}
      <a
        className="underline underline-offset-2 hover:text-foreground"
        href="https://game-icons.net" target="_blank" rel="noreferrer"
      >
        Game-icons.net
      </a>{" "}
      by Delapouite (CC BY 3.0) and{" "}
      <a
        className="underline underline-offset-2 hover:text-foreground"
        href="https://fontawesome.com/license/free" target="_blank" rel="noreferrer"
      >
        Font Awesome Free
      </a>{" "}
      (CC BY 4.0).
    </p>
  );
}
