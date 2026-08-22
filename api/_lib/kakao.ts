const ENDPOINT = "https://dapi.kakao.com/v3/search/book";
const RESULT_COUNT = 5;

export class KakaoKeyMissingError extends Error {
  constructor() {
    super("카카오 API 키가 설정되지 않았습니다.");
    this.name = "KakaoKeyMissingError";
  }
}

/** Kakao's own field names, kept distinct from the response shape widgets use. */
export interface KakaoBook {
  title: string;
  author: string;
  image: string;
  publisher: string;
  pubdate: string;
  /** "YYYY.MM", for Books DB's Published (text) property. */
  published: string;
  /** 13-digit ISBN only — see pickIsbn13. */
  isbn: string;
  /** Kakao's own book detail page, for Books DB's Link (url) property. */
  url: string;
  /** Kakao's book blurb, for the added page's Notes quote block. */
  contents: string;
}

interface KakaoApiDocument {
  title: string;
  authors: string[];
  thumbnail: string;
  publisher: string;
  datetime: string;
  isbn: string;
  url: string;
  contents: string;
}

/**
 * Kakao's `thumbnail` is a 120x174 resize proxy that mangles the cover in
 * Notion's gallery, and its `fname` query param — the real cover URL — often
 * comes back as http://, which Notion blocks as mixed content. Pull that
 * original URL out and force it to https; if there's no fname, or the URL
 * can't be parsed at all, fall back to the thumbnail as given. Anything that
 * still isn't https after that never reaches Notion — better an empty cover
 * than a blocked one.
 */
export function resolveOriginalImageUrl(thumbnail: string): string {
  let candidate = thumbnail;

  try {
    const fname = new URL(thumbnail).searchParams.get("fname");
    if (fname) {
      const decoded = decodeURIComponent(fname);
      candidate = decoded.startsWith("http://") ? `https://${decoded.slice("http://".length)}` : decoded;
    }
  } catch {
    // Malformed thumbnail URL — keep the original string as the fallback candidate.
  }

  return candidate.startsWith("https://") ? candidate : "";
}

/** "YYYY-MM-DD..." -> "YYYY.MM", for Books DB's Published property. */
export function formatPublished(datetime: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(datetime ?? "");
  return m ? `${m[1]}.${m[2]}` : "";
}

/** Kakao sometimes returns "<10-digit ISBN> <13-digit ISBN>" — Books DB only
 *  wants the 13-digit one. A single value (no space) is used as-is. */
export function pickIsbn13(raw: string): string {
  const parts = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? "");
}

export async function searchKakaoBooks(query: string): Promise<KakaoBook[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new KakaoKeyMissingError();

  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&size=${RESULT_COUNT}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `카카오 책 검색 API가 ${res.status}을 반환했습니다.`);
  }

  const data = (await res.json()) as { documents?: KakaoApiDocument[] };
  return (data.documents ?? []).map((doc) => ({
    title: doc.title,
    author: (doc.authors ?? []).join(" · "),
    image: resolveOriginalImageUrl(doc.thumbnail),
    publisher: doc.publisher,
    pubdate: doc.datetime?.slice(0, 4) ?? "",
    published: formatPublished(doc.datetime),
    isbn: pickIsbn13(doc.isbn),
    url: doc.url ?? "",
    contents: doc.contents ?? "",
  }));
}
