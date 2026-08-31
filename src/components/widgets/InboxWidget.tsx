import { useEffect, useState } from "react";
import { fetchInbox, patchInboxTask, type InboxPatch, type InboxTask } from "../../services/notion";
import { useApiData } from "../../hooks/useApiData";
import { notionUrl } from "../../utils/notionUrl";

const PRIORITIES = ["Highest", "Medium", "Lowest"];
const CONTEXTS = ["Home", "Work", "Computer", "Phone", "Outside", "Offline"];
const WHENS = ["오늘", "이번 주", "다음 주", "날짜 없음"];
const STATUSES = ["Inbox", "Next Action", "Waiting For", "Project", "Someday", "Reference"];

const FADE_MS = 400;

export function InboxWidget() {
  const { data, error } = useApiData(fetchInbox, []);
  const [rows, setRows] = useState<InboxTask[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setRows(data.tasks);
  }, [data]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">불러오는 중</div>;
  if (!rows.length) return <div className="empty-box">받은 것이 없습니다</div>;

  const update = async (task: InboxTask, patch: InboxPatch) => {
    const prev = task;
    setRows((rs) => rs.map((r) => (r.id === task.id ? { ...r, ...patch } : r)));
    setSavingIds((s) => new Set(s).add(task.id));
    setRowErrors((e) => {
      if (!(task.id in e)) return e;
      const next = { ...e };
      delete next[task.id];
      return next;
    });
    try {
      await patchInboxTask(task.id, patch);
      if (patch.status && patch.status !== "Inbox") {
        setFadingIds((s) => new Set(s).add(task.id));
        setTimeout(() => setRows((rs) => rs.filter((r) => r.id !== task.id)), FADE_MS);
      }
    } catch (err) {
      setRows((rs) => rs.map((r) => (r.id === task.id ? prev : r)));
      setRowErrors((e) => ({ ...e, [task.id]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setSavingIds((s) => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
  };

  const toggleContext = (task: InboxTask, ctx: string) => {
    const context = task.context.includes(ctx) ? task.context.filter((c) => c !== ctx) : [...task.context, ctx];
    update(task, { context });
  };

  return (
    <ul className="list">
      {rows.map((t) => (
        <li key={t.id} className={`inbox-row${fadingIds.has(t.id) ? " fading" : ""}${savingIds.has(t.id) ? " saving" : ""}`}>
          <a className="plain-link inbox-title" href={notionUrl(t.id)} target="_blank" rel="noreferrer">{t.name}</a>
          <div className="inbox-controls">
            <select
              className="inbox-control"
              value={t.priority}
              aria-label={`${t.name} Priority`}
              onChange={(e) => update(t, { priority: e.target.value })}
            >
              <option value="">Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="inbox-context">
              {CONTEXTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`inbox-chip${t.context.includes(c) ? " on" : ""}`}
                  aria-pressed={t.context.includes(c)}
                  onClick={() => toggleContext(t, c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <select
              className="inbox-control"
              value={t.when}
              aria-label={`${t.name} When`}
              onChange={(e) => update(t, { when: e.target.value })}
            >
              <option value="">When</option>
              {WHENS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <input
              type="date"
              className="inbox-control"
              value={t.due ?? ""}
              aria-label={`${t.name} Due`}
              onChange={(e) => update(t, { due: e.target.value || null })}
            />
            <select
              className="inbox-control"
              value={t.status}
              aria-label={`${t.name} Status`}
              onChange={(e) => update(t, { status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="btn tiny" onClick={() => update(t, { status: "Next Action" })}>→ Next</button>
          </div>
          {rowErrors[t.id] && <div className="error">{rowErrors[t.id]}</div>}
        </li>
      ))}
    </ul>
  );
}
