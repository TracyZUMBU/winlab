import { useMemo } from "react";

import { markdownToSanitizedHtml } from "../lib/markdownToSanitizedHtml";

type MarkdownDocViewProps = {
  markdown: string;
};

export function MarkdownDocView({ markdown }: MarkdownDocViewProps) {
  const html = useMemo(() => markdownToSanitizedHtml(markdown), [markdown]);

  return (
    <div
      className="admin-markdown-doc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
