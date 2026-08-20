import type { ReactNode } from "react";

export interface EmbedStatItem {
  key: string;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}

/** Pattern B (WIDGET-SPEC.md): big serif numbers, 4 across, 2x2 on narrow embeds. */
export function EmbedStats({ stats }: { stats: EmbedStatItem[] }) {
  return (
    <div className="embed-stats">
      {stats.map((s) => (
        <div className="embed-stat" key={s.key}>
          <div className="widget-title">{s.label}</div>
          <div className="embed-stat-value">{s.value}</div>
          {s.caption && <div className="embed-stat-caption">{s.caption}</div>}
        </div>
      ))}
    </div>
  );
}
