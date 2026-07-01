import { Navigate, useParams } from "react-router-dom";

import { MarkdownDocView } from "../components/MarkdownDocView";
import {
  defaultAdminDocSlug,
  getAdminDocBySlug,
} from "../docs.registry";

export function DocMemoPage() {
  const { docSlug } = useParams<{ docSlug: string }>();
  const doc = getAdminDocBySlug(docSlug);

  if (!doc) {
    return <Navigate to={`/docs/${defaultAdminDocSlug}`} replace />;
  }

  return (
    <article className="admin-doc-page">
      <header className="admin-doc-page__header">
        <h1 className="admin-doc-page__title">{doc.title}</h1>
      </header>
      <MarkdownDocView markdown={doc.markdown} />
    </article>
  );
}
