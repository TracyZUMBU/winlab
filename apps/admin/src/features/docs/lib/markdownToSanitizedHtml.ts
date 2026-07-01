import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function markdownToSanitizedHtml(markdown: string): string {
  const raw = marked.parse(markdown || "") as string;
  return DOMPurify.sanitize(raw);
}
