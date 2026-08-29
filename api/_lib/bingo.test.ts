/**
 * Runtime check for latestBoard's board-picking. Not a framework test — run
 * directly with node after compiling, same pattern as kakao.test.ts. Guards
 * against the bug where a pre-created future board (e.g. "2026.09 Monthly"
 * made ahead of time and still empty) outranked the current month's board
 * just because its label sorts later.
 */
import assert from "node:assert/strict";
import { latestBoard, type BingoRow } from "./bingo.js";

function row(board: string, no: number, name: string): BingoRow {
  return { id: `${board}-${no}`, name, board, no, done: false };
}

function main() {
  {
    const rows = [
      ...[1, 2].map((n) => row("2026.08 Monthly", n, `august-${n}`)),
      ...[1, 2].map((n) => row("2026.09 Monthly", n, "·")),
    ];
    const { board, items } = latestBoard(rows, "Monthly");
    assert.equal(board, "2026.08 Monthly", `expected the current month's board, got: ${board}`);
    assert.deepEqual(items.map((i) => i.name), ["august-1", "august-2"]);
    console.log("PASS  current month's board wins over a pre-created, still-empty future board ->", board);
  }

  {
    const rows = [1, 2].map((n) => row("2025.01 Monthly", n, `jan-${n}`));
    const { board } = latestBoard(rows, "Monthly");
    assert.equal(board, "2025.01 Monthly", `expected the only (past) board, got: ${board}`);
    console.log("PASS  no current/future board exists -> falls back to the latest past board ->", board);
  }

  {
    const rows = [
      ...[1].map((n) => row("2026 Spring Quarterly", n, "spring")),
      ...[1].map((n) => row("2026 Fall Quarterly", n, "fall")),
    ];
    const { board } = latestBoard(rows, "Quarterly");
    assert.equal(board, "2026 Spring Quarterly", `expected alphabetically-latest fallback (no YYYY.MM prefix), got: ${board}`);
    console.log("PASS  Quarterly labels (no YYYY.MM prefix) fall back to string-max ->", board);
  }

  console.log("\nALL PASS");
}

main();
