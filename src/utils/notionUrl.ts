/** Notion page URL from a page id — works whether the id has dashes or not. */
export function notionUrl(pageId: string): string {
  return `https://www.notion.so/${pageId.replace(/-/g, "")}`;
}
