/**
 * Lazy-loaded Markdown Renderer Component
 *
 * This component wraps ReactMarkdown and provides consistent markdown rendering
 * with dark mode support and custom styling.
 */
import React from "react";
import ReactMarkdown from "react-markdown";

interface LazyMarkdownProps {
  children: string;
  className?: string;
}

const LazyMarkdown: React.FC<LazyMarkdownProps> = ({
  children,
  className = "",
}) => {
  const markdownComponents = {
    p: ({ ...props }) => (
      <p className="dark:text-slate-200 markdown-p" {...props} />
    ),
    strong: ({ ...props }) => (
      <strong className="dark:text-slate-100 markdown-strong" {...props} />
    ),
    em: ({ ...props }) => (
      <em className="dark:text-slate-200 markdown-em" {...props} />
    ),
    h1: ({ ...props }) => (
      <h1 className="dark:text-slate-100 markdown-h1" {...props} />
    ),
    h2: ({ ...props }) => (
      <h2 className="dark:text-slate-100 markdown-h2" {...props} />
    ),
    h3: ({ ...props }) => (
      <h3 className="dark:text-slate-100 markdown-h3" {...props} />
    ),
    ul: ({ ...props }) => (
      <ul className="dark:text-slate-200 markdown-ul" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="dark:text-slate-200 markdown-ol" {...props} />
    ),
    li: ({ ...props }) => (
      <li className="dark:text-slate-200 markdown-li" {...props} />
    ),
    blockquote: ({ ...props }) => (
      <blockquote
        className="dark:text-slate-200 dark:border-slate-600 markdown-blockquote"
        {...props}
      />
    ),
    code: ({ ...props }) => (
      <code
        className="dark:bg-slate-700 dark:text-slate-200 markdown-code"
        {...props}
      />
    ),
  };

  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>
    </div>
  );
};

export default LazyMarkdown;
