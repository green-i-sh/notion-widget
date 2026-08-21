import type { ReactNode } from "react";

export interface EmbedRowItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

/** Pattern A (WIDGET-SPEC.md): label left, value right, a rule under every row. */
export function EmbedRows({ rows }: { rows: EmbedRowItem[] }) {
  return (
    <>
      {rows.map((row) => (
        <div className="embed-row" key={row.key}>
          <span className="embed-row-label">{row.label}</span>
          <span className="embed-row-value">{row.value}</span>
        </div>
      ))}
    </>
  );
}
