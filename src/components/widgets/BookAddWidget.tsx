import { useState } from "react";
import { searchBooks, addBook, type NaverBook } from "../../services/notion";

export function BookAddWidget() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NaverBook[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const { books } = await searchBooks(q);
      setResults(books);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const pick = async (book: NaverBook) => {
    setError(null);
    setStatus(null);
    try {
      const res = await addBook({ title: book.title, author: book.author, cover: book.image, publisher: book.publisher });
      setStatus(res.duplicate ? `"${book.title}" 추가 완료 — 이미 Books에 있던 책입니다.` : `"${book.title}" 추가 완료.`);
      setResults(null);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <input
        value={query}
        placeholder="책 제목"
        aria-label="책 제목 검색"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
      />
      {error && <div className="error">{error}</div>}
      {status && <div className="muted">{status}</div>}
      {loading && <div className="empty">검색 중</div>}
      {results && (
        <ul className="list">
          {results.map((b) => (
            <li key={`${b.title}-${b.publisher}-${b.pubdate}`}>
              {b.image ? <img src={b.image} alt="" className="book-thumb" /> : <div className="book-thumb" />}
              <div className="grow">
                <div>{b.title}</div>
                <div className="muted">{b.author} · {b.publisher}</div>
              </div>
              <button type="button" className="btn" onClick={() => pick(b)}>추가</button>
            </li>
          ))}
          {!results.length && <li className="empty">검색 결과가 없습니다.</li>}
        </ul>
      )}
    </>
  );
}
