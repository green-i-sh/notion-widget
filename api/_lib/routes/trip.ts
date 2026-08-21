import type { ApiRequest, ApiResponse } from "../types.js";
import { queryDatabase, propString } from "../notion.js";
import { sendError, withCache } from "../http.js";
import { DB } from "../db.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const tripName = typeof req.query.trip === "string" ? req.query.trip : undefined;

  try {
    const result = await queryDatabase(DB.trips, {
      filter: tripName
        ? { property: "Name", title: { equals: tripName } }
        : { property: "Phase", select: { equals: "After Trip" } },
      page_size: 1,
    });

    const page = result.results[0];
    if (!page) {
      res.status(200).json({ found: false });
      return;
    }

    const p = page.properties;
    withCache(res);
    res.status(200).json({
      found: true,
      name: propString(p["Name"]),
      phase: propString(p["Phase"]),
      columns: [
        { key: "moment", label: "Best Moment", text: propString(p["Best Moment"]), tag: "" },
        { key: "place", label: "Favorite Place", text: propString(p["Favorite Place"]), tag: propString(p["Favorite Place Time"]) },
        { key: "change", label: "What I'd Change", text: propString(p["What I'd Change"]), tag: propString(p["Revisit"]) },
      ],
    });
  } catch (err) {
    sendError(res, err, { endpoint: "trip", databaseId: DB.trips });
  }
}
