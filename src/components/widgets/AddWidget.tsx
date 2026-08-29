import { useState } from "react";
import { addEntry, type AddTarget } from "../../services/notion";

const LABELS: Record<AddTarget, string> = {
  task: "Inbox",
  expense: "Expense",
  income: "Income",
  life: "Life",
  letter: "Letter",
};

const TARGETS: AddTarget[] = ["task", "expense", "income", "life", "letter"];

function targetParam(): AddTarget {
  const to = new URLSearchParams(window.location.search).get("to");
  return (TARGETS as string[]).includes(to ?? "") ? (to as AddTarget) : "task";
}

export function AddWidget() {
  const to = targetParam();
  const needsAmount = to === "expense" || to === "income";
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = title.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addEntry(to, value, needsAmount ? Number(amount) || 0 : undefined);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setTitle("");
        setAmount("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="add-bar">
      {error ? (
        <span className="error add-bar-label" title={error}>{error}</span>
      ) : done ? (
        <span className="add-bar-done">추가됨</span>
      ) : (
        <span className="muted add-bar-label">＋ {LABELS[to]}</span>
      )}
      <input
        className="add-bar-title"
        value={title}
        placeholder="추가할 항목"
        disabled={busy}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {needsAmount && (
        <input
          className="add-bar-amount"
          value={amount}
          placeholder="금액"
          inputMode="numeric"
          disabled={busy}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      )}
      <button type="button" className="btn ghost tiny" disabled={busy || !title.trim()} onClick={submit} aria-label="추가">＋</button>
    </div>
  );
}
