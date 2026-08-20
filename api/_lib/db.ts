/**
 * Database IDs, from NOTION.md. Centralized so no endpoint hardcodes its
 * own copy — 11 widgets each needing a DB ID makes that drift fast.
 * "Routine Check" is intentionally omitted: NOTION.md marks it unused,
 * since Daily Log's checkboxes are what routine/today actually read.
 */
export const DB = {
  tasks: "06302b1af3a749508270d58e32df9f46",
  timeLog: "6b79332a8eea457f94560296f866f214",
  dailyLog: "3c91cb4b5255486c98c6128f44650848",
  finance: "e8768a8de1ee483f9d89764732df2c29",
  fixedExpense: "014a2496cd7443feb4adae5155349431",
  budget: "4cf3969375a04ee2953d0f00feb0b006",
  life: "38c6359d8cb741958f3d2846cfd5a524",
  books: "ad322dffe3cd4b098981a2cd895b5c7d",
  trips: "5f00b7a7a42e4bdaad7384171d3c896e",
  moneyLetter: "ae109bbc5bb44b92bbedf0bc319d04f3",
  bingo: "518a7ad69e0a49fbbba066995d76a20e",
  review: "3dc712a7442e4a2eaa54965050fbf987",
  streak: "555ee768575c4882b24ef03f637a2622",
} as const;
