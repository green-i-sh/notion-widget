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
}

interface KakaoApiDocument {
  title: string;
  authors: string[];
  thumbnail: string;
  publisher: string;
  datetime: string;
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
    image: doc.thumbnail,
    publisher: doc.publisher,
    pubdate: doc.datetime?.slice(0, 4) ?? "",
  }));
}
