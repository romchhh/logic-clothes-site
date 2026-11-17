"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownBody({
  markdown,
  className = "content-md",
}: {
  markdown: string;
  className?: string;
}) {
  if (!markdown?.trim()) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt || ""} className="content-md-img" />
            ) : null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
