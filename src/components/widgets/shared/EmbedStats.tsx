import type { CSSProperties, ReactNode } from "react";

export interface EmbedStatItem {
  key: string;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}

/** Pattern B (WIDGET-SPEC.md): big serif numbers, 4 across (or `columns`), 2x2 on narrow embeds. */
export function EmbedStats({ stats, columns }: { stats: EmbedStatItem[]; columns?: number }) {
  const style = columns ? ({ "--embed-stats-cols": columns } as CSSProperties) : undefined;
  return (
    <div className="embed-stats" style={style}>
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
