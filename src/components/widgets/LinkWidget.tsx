import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { uid } from "../../utils/id";

/** Accepts bare hosts and normalises them, rejects anything non-http. */
function normalise(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function LinkWidget() {
  const { data } = useAppState();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const name = label.trim();
    const href = normalise(url);
    if (!name) return setError("이름을 입력해 주세요.");
    if (!href) return setError("주소를 확인해 주세요. 예: notion.so");
    actions.setData("links", [...data.links, { id: uid(), label: name, url: href }]);
    setLabel("");
    setUrl("");
    setError(null);
  };

  return (
    <>
      <ul className="list link-list">
        {data.links.map((l) => (
          <li key={l.id}>
            <a className="grow" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a>
            <button type="button" className="btn ghost" aria-label={`${l.label} 삭제`} onClick={() => actions.setData("links", data.links.filter((x) => x.id !== l.id))}>✕</button>
          </li>
        ))}
        {!data.links.length && <li className="empty">자주 가는 사이트를 등록해 보세요.</li>}
      </ul>
      <div className="row">
        <input value={label} placeholder="이름" aria-label="링크 이름" onChange={(e) => setLabel(e.target.value)} style={{ maxWidth: 100 }} />
        <input value={url} placeholder="notion.so" aria-label="링크 주소" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
      {error && <div className="error">{error}</div>}
    </>
  );
}
