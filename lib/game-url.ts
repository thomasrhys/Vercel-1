export function normalizeGameUrl(value: unknown): string {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return "";

  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        parsed.protocol = "https:";
        return parsed.toString();
      }
    } catch {
      return "";
    }
  }

  return url;
}
