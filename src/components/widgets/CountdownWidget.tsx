import type { WidgetConfig } from "../../types";
import { actions } from "../../store/appStore";
import { useNow } from "../../hooks/useNow";
import { hhmmss } from "../../utils/date";

export function CountdownWidget({ config }: { config: WidgetConfig }) {
  const target = typeof config.options.target === "string" ? config.options.target : "";
  const title = typeof config.options.title === "string" ? config.options.title : "";
  const now = useNow(1000);

  const at = target ? new Date(target).getTime() : NaN;
  const valid = Number.isFinite(at);
  const remaining = valid ? (at - now.getTime()) / 1000 : 0;
  const finished = valid && remaining <= 0;

  return (
    <>
      <input
        value={title}
        placeholder="제목"
        aria-label="카운트다운 제목"
        onChange={(e) => actions.setWidgetOption(config.id, "title", e.target.value)}
      />
      <input
        type="datetime-local"
        value={target}
        aria-label="목표 시각"
        onChange={(e) => actions.setWidgetOption(config.id, "target", e.target.value)}
      />
      {!valid ? (
        <div className="empty">목표 시각을 정하면 남은 시간이 표시됩니다.</div>
      ) : (
        <div className="mono-time">{finished ? "00:00:00" : hhmmss(remaining)}</div>
      )}
      {finished && <div className="muted">종료되었습니다.</div>}
    </>
  );
}
