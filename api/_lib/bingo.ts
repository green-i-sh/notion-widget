import { queryDatabase, propNumber, propString, propCheckbox } from "./notion.js";
import { DB } from "./db.js";

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
 *  month) — pick the most recent one, not every match. */
export function latestBoard(rows: BingoRow[], label: "Monthly" | "Quarterly"): { board: string; items: BingoRow[] } {
  const matching = rows.filter((r) => r.board.includes(label));
  const board = matching.reduce((max, r) => (r.board > max ? r.board : max), "");
  const items = matching.filter((r) => r.board === board).sort((a, b) => a.no - b.no);
  return { board, items };
}
