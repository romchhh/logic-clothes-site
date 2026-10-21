import ContentPage from "@/components/shared/ContentPage";
import type { LegalPage } from "@/lib/content/legal";

export default function LegalContent({ page }: { page: LegalPage }) {
  return (
    <ContentPage title={page.title} eyebrow={page.updated} lead={page.intro}>
      {page.sections.map((section) => (
        <section className="content-block" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p} className="content-p">
              {p.split("\n").map((line, i) => (
                <span key={`${p}-${i}`}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          ))}
          {section.bullets && (
            <ul className="content-list">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </ContentPage>
  );
}
