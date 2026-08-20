import type { WidgetConfig } from "../../types";
import { useNow } from "../../hooks/useNow";
import { WEEKDAYS_EN, pad2 } from "../../utils/date";

export function ClockWidget({ config }: { config: WidgetConfig }) {
  const showSeconds = config.options.showSeconds !== false;
  const hour12 = config.options.hour12 === true;
  const showDate = config.options.showDate !== false;
  const now = useNow(showSeconds ? 1000 : 20_000);

  const h24 = now.getHours();
  const h = hour12 ? h24 % 12 || 12 : h24;
  const parts = [pad2(h), pad2(now.getMinutes())];
  if (showSeconds) parts.push(pad2(now.getSeconds()));

  return (
    <>
      <div className="clock-time">
        {parts.join(":")}
        {hour12 && <span className="clock-meta"> {h24 < 12 ? "AM" : "PM"}</span>}
      </div>
      {showDate && (
        <div className="clock-meta">
          {WEEKDAYS_EN[now.getDay()]}
          <br />
          {now.getFullYear()}.{pad2(now.getMonth() + 1)}.{pad2(now.getDate())}
        </div>
      )}
    </>
  );
}
