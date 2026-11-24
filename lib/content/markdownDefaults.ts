import type { AboutLocaleContent } from "@/lib/sitePagesTypes";
import type { LegalPage } from "@/lib/content/legal";

/** Build markdown body from legacy structured about fields. */
export function aboutToMarkdown(c: AboutLocaleContent): string {
  if (c.bodyMarkdown?.trim()) return c.bodyMarkdown;

  const parts: string[] = [];
  if (c.lead?.trim()) parts.push(c.lead.trim());

  if (c.sectionTitle?.trim() || (c.points?.length ?? 0) > 0) {
    parts.push("");
    if (c.sectionTitle?.trim()) parts.push(`## ${c.sectionTitle.trim()}`);
    for (const point of c.points ?? []) {
      if (point.trim()) parts.push(`- ${point.trim()}`);
    }
  }

  if (c.closingTitle?.trim() || (c.closing?.length ?? 0) > 0) {
    parts.push("");
    if (c.closingTitle?.trim()) parts.push(`## ${c.closingTitle.trim()}`);
    for (const line of c.closing ?? []) {
      if (line.trim()) parts.push(line.trim());
    }
  }

  return parts.join("\n").trim() + "\n";
}

/** Build markdown body from legacy legal page fields. */
export function legalToMarkdown(page: LegalPage): string {
  if (page.bodyMarkdown?.trim()) return page.bodyMarkdown;

  const parts: string[] = [];
  if (page.intro?.trim()) parts.push(page.intro.trim());

  for (const section of page.sections ?? []) {
    parts.push("");
    if (section.heading?.trim()) parts.push(`## ${section.heading.trim()}`);
    for (const p of section.paragraphs ?? []) {
      if (p.trim()) parts.push(p.trim());
    }
    for (const b of section.bullets ?? []) {
      if (b.trim()) parts.push(`- ${b.trim()}`);
    }
  }

  return parts.join("\n").trim() + "\n";
}
