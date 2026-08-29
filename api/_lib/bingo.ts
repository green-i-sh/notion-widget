import { queryDatabase, propNumber, propString, propCheckbox } from "./notion.js";
import { DB } from "./db.js";
import { monthOf } from "./date.js";

export interface BingoRow {
  id: string;
  name: string;
  board: string;
  no: number;
  done: boolean;
}

/** Every Bingo row, unfiltered — Board is a select, and Notion validates
 *  `equals` against the option list, so filtering by a guessed/constructed
 *  board name 400s. Fetch everything and match in JS instead. */
export async function fetchBingoRows(): Promise<BingoRow[]> {
  const result = await queryDatabase(DB.bingo, {
    sorts: [{ property: "No", direction: "ascending" }],
    page_size: 100,
  });
  return result.results.map((page) => ({
    id: page.id,
    name: propString(page.properties["Name"]),
    board: propString(page.properties["Board"]),
    no: propNumber(page.properties["No"]),
    done: propCheckbox(page.properties["Done"]),
  }));
}

/** Boards of the same kind pile up over time (a new "2026.09 Monthly" each
 *  month, sometimes pre-created ahead of time and still empty) — pick the
 *  one for the current month, not just whichever sorts last. Falls back to
 *  the alphabetically latest label when none carry a "YYYY.MM" prefix
 *  (Quarterly's "YYYY <season> Quarterly" naming has no month component). */
export function latestBoard(rows: BingoRow[], label: "Monthly" | "Quarterly"): { board: string; items: BingoRow[] } {
  const matching = rows.filter((r) => r.board.includes(label));
  const board = pickCurrentBoard(matching.map((r) => r.board));
  const items = matching.filter((r) => r.board === board).sort((a, b) => a.no - b.no);
  return { board, items };
}

function pickCurrentBoard(labels: string[]): string {
  const currentPrefix = monthOf();
  const dated = labels
    .map((label) => ({ label, prefix: label.match(/^\d{4}\.\d{2}/)?.[0] }))
    .filter((x): x is { label: string; prefix: string } => Boolean(x.prefix));

  if (dated.length) {
    const notFuture = dated.filter((x) => x.prefix <= currentPrefix);
    const pool = notFuture.length ? notFuture : dated;
    return pool.reduce((max, x) => (x.prefix > max.prefix ? x : max)).label;
  }

  return labels.reduce((max, label) => (label > max ? label : max), "");
}
