import type { ReactNode } from "react";

export default function ContentPage({
  title,
  eyebrow,
  lead,
  children,
}: {
  title: string;
  eyebrow?: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <article className="content-page">
      <header className="content-page-head">
        {eyebrow && <p className="content-page-eyebrow">{eyebrow}</p>}
        <h1 className="content-page-title">{title}</h1>
        {lead && <p className="content-page-lead">{lead}</p>}
      </header>
      <div className="content-page-body">{children}</div>
    </article>
  );
}
