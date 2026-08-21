import { useEffect, useRef, useState } from "react";
import { fetchMorning, saveMorningField, type MorningField } from "../../services/notion";
import { dateParam } from "../../utils/date";

const SAVE_DELAY_MS = 1500;

/**
 * Deliberately not useApiData here: that hook polls every 60s and refetches
 * on focus, which would blow away whatever the user is mid-typing. This
 * widget loads once per date and only ever pushes local edits outward.
 */
function useAutosaveField(date: string, field: MorningField, serverValue: string) {
  const [value, setValue] = useState(serverValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(serverValue);
    setStatus("idle");
  }, [date, serverValue]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveMorningField(date, field, next);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, SAVE_DELAY_MS);
  };

  return { value, onChange, status };
}

function statusText(status: string): string {
  if (status === "saving") return "저장 중";
  if (status === "saved") return "저장됨";
  if (status === "error") return "저장 실패";
  return "";
}

function MorningEditor({ date, initialMorning, initialLog }: { date: string; initialMorning: string; initialLog: string }) {
  const morning = useAutosaveField(date, "morning", initialMorning);
  const log = useAutosaveField(date, "log", initialLog);

  return (
    <div className="morning-cols">
      <div className="morning-col lav">
        <div className="widget-title">Morning Page</div>
        <textarea rows={6} value={morning.value} onChange={(e) => morning.onChange(e.target.value)} />
        <span className="muted">{statusText(morning.status)}</span>
      </div>
      <div className="morning-col gray">
        <div className="widget-title">Daily Log</div>
        <textarea rows={6} value={log.value} onChange={(e) => log.onChange(e.target.value)} />
        <span className="muted">{statusText(log.status)}</span>
      </div>
    </div>
  );
}

export function MorningWidget() {
  const date = dateParam();
  const [data, setData] = useState<{ date: string; morning: string; log: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMorning(date)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [date]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;

  return <MorningEditor date={data.date} initialMorning={data.morning} initialLog={data.log} />;
}
