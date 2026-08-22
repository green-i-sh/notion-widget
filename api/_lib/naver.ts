const ENDPOINT = "https://openapi.naver.com/v1/search/book.json";
const RESULT_COUNT = 5;

export class NaverKeyMissingError extends Error {
  constructor() {
    super("네이버 API 키가 설정되지 않았습니다.");
    this.name = "NaverKeyMissingError";
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/** Naver returns multiple authors joined by "|" — the widget shows them "저자1 · 저자2". */
function formatAuthor(raw: string): string {
  return stripTags(raw)
    .split("|")
    .map((a) => a.trim())
    .filter(Boolean)
    .join(" · ");
}

export interface NaverBook {
  title: string;
  author: string;
  image: string;
  publisher: string;
  pubdate: string;
}

interface NaverApiItem {
  title: string;
  author: string;
  image: string;
  publisher: string;
  pubdate: string;
}

export async function searchNaverBooks(query: string): Promise<NaverBook[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) throw new NaverKeyMissingError();

  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&display=${RESULT_COUNT}`;
  const res = await fetch(url, {
    headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { errorMessage?: string } | null;
    throw new Error(body?.errorMessage ?? `네이버 책 검색 API가 ${res.status}을 반환했습니다.`);
  }

  const data = (await res.json()) as { items?: NaverApiItem[] };
  return (data.items ?? []).map((item) => ({
    title: stripTags(item.title),
    author: formatAuthor(item.author),
    image: item.image,
    publisher: item.publisher,
    pubdate: item.pubdate,
  }));
}
