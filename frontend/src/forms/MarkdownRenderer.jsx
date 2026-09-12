import React from 'react';
import { marked } from 'marked';

// Configure marked globally
marked.setOptions({ breaks: true, gfm: true });

// --- PREPROCESSOR: handles ![alt](url){width=50%} syntax ---
const preprocessMarkdown = (md) => {
  if (!md) return '';
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src, widthAttr) => {
    let w = widthAttr.replace('width=', '').trim();
    if (!w.endsWith('%') && !w.endsWith('px') && !w.endsWith('vw')) w += '%';
    return `<img src="${src}" alt="${alt}" style="width:${w};max-width:100%;" />`;
  });
};

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  let html = marked.parse(preprocessMarkdown(content));
  // Force all links open in new tab
  html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');

  return (
    <>
      <style>{`
        .md-body { color: #e4e4e7; font-size: 0.875rem; line-height: 1.7; }
        .md-body p { margin: 0 0 0.75rem 0; }
        .md-body p:last-child { margin-bottom: 0; }
        .md-body strong { color: #ffffff; font-weight: 700; }
        .md-body em { color: #d4d4d8; font-style: italic; }
        .md-body a { color: #60a5fa; text-decoration: underline; text-underline-offset: 3px; word-break: break-all; }
        .md-body a:hover { color: #93c5fd; }
        .md-body img { max-width: 100%; border-radius: 8px; margin: 0.75rem 0; border: 1px solid #3f3f46; display: block; }
        .md-body hr { border: none; border-top: 1px solid #52525b; margin: 1.25rem 0; }
        .md-body h1 { color: #ffffff; font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; letter-spacing: -0.025em; }
        .md-body h2 { color: #f4f4f5; font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #27272a; }
        .md-body h3 { color: #e4e4e7; font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
        .md-body ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .md-body ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
        .md-body li { color: #d4d4d8; margin: 0.15rem 0; }
        .md-body ol li::marker { color: #60a5fa; font-weight: 600; }
        .md-body code { background: #27272a; color: #93c5fd; padding: 0.1rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; border: 1px solid #3f3f46; }
        .md-body pre { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0.75rem 0; }
        .md-body pre code { background: transparent; border: none; padding: 0; color: #d4d4d8; font-size: 0.8rem; }
        .md-body blockquote { border-left: 4px solid #3b82f6; background: rgba(59,130,246,0.07); padding: 0.5rem 0.75rem; margin: 0.75rem 0; border-radius: 0 6px 6px 0; color: #a1a1aa; font-style: normal; }
        .md-body table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.8rem; }
        .md-body th { background: #09090b; border: 1px solid #3f3f46; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; color: #ffffff; }
        .md-body td { border: 1px solid #27272a; padding: 0.5rem 0.75rem; color: #d4d4d8; }
        .md-body tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>
      <div
        className={`md-body ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
