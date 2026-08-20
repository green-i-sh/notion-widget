import type { ApiRequest, ApiResponse } from "./_lib/types";
import { queryDatabase, propNumber, propString, propDateStart } from "./_lib/notion";
import { todayKST, addDays } from "./_lib/date";

const TIME_LOG_DB = "6b79332a8eea457f94560296f866f214";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : todayKST();
  const startISO = `${date}T00:00:00+09:00`;
  const endISO = `${addDays(date, 1)}T00:00:00+09:00`;

  try {
    const result = await queryDatabase(TIME_LOG_DB, {
      filter: {
        and: [
          { property: "Start", date: { on_or_after: startISO } },
          { property: "Start", date: { before: endISO } },
        ],
      },
      sorts: [{ property: "Start", direction: "ascending" }],
      page_size: 50,
    });

    let totalMin = 0;
    const entries = result.results.map((page) => {
      const props = page.properties;
      const durationMin = propNumber(props["Duration (min)"]);
      totalMin += durationMin;
      return {
        id: page.id,
        title: propString(props["Name"]),
        start: propDateStart(props["Start"]),
        end: propDateStart(props["End"]),
        durationMin,
        note: propString(props["What I did"]),
      };
    });

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ date, totalMin, entries });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
