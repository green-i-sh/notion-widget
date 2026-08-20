import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { uid } from "../../utils/id";

export function QuoteWidget() {
  const { data } = useAppState();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  const quote = data.quotes.length ? data.quotes[index % data.quotes.length] : null;

  const add = () => {
    const body = text.trim();
    if (!body) return;
    actions.setData("quotes", [...data.quotes, { id: uid(), text: body, author: author.trim() }]);
    setText("");
    setAuthor("");
  };

  return (
    <>
      {quote ? (
        <>
          <p className="quote-text">{quote.text}</p>
          {quote.author && <div className="muted">— {quote.author}</div>}
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setIndex((i) => i + 1)}>다른 문장</button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => actions.setData("quotes", data.quotes.filter((q) => q.id !== quote.id))}
            >삭제</button>
          </div>
        </>
      ) : (
        <div className="empty">문장을 추가해 보세요.</div>
      )}
      <div className="row">
        <input value={text} placeholder="문장" aria-label="문장" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input value={author} placeholder="작가" aria-label="작가" onChange={(e) => setAuthor(e.target.value)} style={{ maxWidth: 90 }} />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </>
  );
}
