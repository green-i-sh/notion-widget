/** Short unique id. crypto.randomUUID is missing in some embed contexts. */
export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}
