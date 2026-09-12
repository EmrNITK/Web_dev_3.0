import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Link as LinkIcon, List, ListOrdered,
  Image as ImageIcon, X, Check, Eye, Edit3, Minus
} from 'lucide-react';
import { marked } from 'marked';
import ImageUploader from './ImageUploader';

// ---------------------------------------------------------------------------
// Configure marked once
// ---------------------------------------------------------------------------
marked.setOptions({ breaks: true, gfm: true });

// ---------------------------------------------------------------------------
// Image-width preprocessor  ![alt](src){width=50%}  →  <img style="width:50%">
// ---------------------------------------------------------------------------
const preprocessMarkdown = (md) => {
  if (!md) return '';
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src, widthAttr) => {
    let w = widthAttr.replace('width=', '').trim();
    if (!w.endsWith('%') && !w.endsWith('px') && !w.endsWith('vw')) w += '%';
    return `<img src="${src}" alt="${alt}" style="width:${w};max-width:100%;" />`;
  });
};

// ---------------------------------------------------------------------------
// Render markdown → safe HTML string
// ---------------------------------------------------------------------------
const renderMarkdown = (md) => {
  if (!md) return '';
  let html = marked.parse(preprocessMarkdown(md));
  html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
  return html;
};

// ---------------------------------------------------------------------------
// Insert text at textarea cursor position, preserving undo history
// ---------------------------------------------------------------------------
const insertAtCursor = (textarea, before, after = '', placeholder = '') => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end) || placeholder;
  const replacement = before + selected + after;
  textarea.focus();
  document.execCommand('insertText', false, replacement);
  const newCursor = start + before.length + selected.length;
  textarea.setSelectionRange(newCursor, newCursor);
};

// Insert a block (hr, heading) on its own line
const insertBlock = (textarea, snippet) => {
  const start = textarea.selectionStart;
  const val = textarea.value;
  const needsBefore = start > 0 && val[start - 1] !== '\n' ? '\n' : '';
  textarea.focus();
  document.execCommand('insertText', false, needsBefore + snippet + '\n');
};

// ---------------------------------------------------------------------------
// ToolbarBtn helper
// ---------------------------------------------------------------------------
const ToolbarBtn = ({ onClick, icon: Icon, title, active }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    title={title}
    className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
  >
    {Icon && <Icon className="w-4 h-4" />}
  </button>
);

const Sep = () => <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />;

const ModeBtn = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const RichMarkdownEditor = ({ initialValue = '', onChange }) => {
  const textareaRef = useRef(null);
  const linkUrlRef = useRef(null);
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState('write'); // 'write' | 'preview' | 'split'
  const [showUploader, setShowUploader] = useState(false);
  const [linkState, setLinkState] = useState({ isOpen: false, url: '', text: '' });

  // Sync if parent pushes a new initialValue after mount (e.g. API load)
  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleChange = useCallback((e) => {
    const newVal = e.target.value;
    setValue(newVal);
    onChange?.(newVal);
  }, [onChange]);

  // ── Toolbar helpers ──────────────────────────────────────────────────────

  const wrap = useCallback((before, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    insertAtCursor(ta, before, after, placeholder);
    const newVal = ta.value;
    setValue(newVal);
    onChange?.(newVal);
  }, [onChange]);

  const block = useCallback((snippet) => {
    const ta = textareaRef.current;
    if (!ta) return;
    insertBlock(ta, snippet);
    const newVal = ta.value;
    setValue(newVal);
    onChange?.(newVal);
  }, [onChange]);

  const handleImageUploaded = useCallback((url) => {
    wrap(`![Image](${url}){width=50%}`);
    setShowUploader(false);
  }, [wrap]);

  const saveLink = useCallback(() => {
    const { url, text } = linkState;
    if (url) {
      wrap(`[${text || 'link'}](${url})`);
    }
    setLinkState({ isOpen: false, url: '', text: '' });
  }, [linkState, wrap]);

  // Tab key → 2-space indent
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      wrap('  ');
    }
  }, [wrap]);

  const previewHtml = renderMarkdown(value);
  const showWrite = mode === 'write' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/60">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-zinc-900 border-b border-zinc-800 flex-wrap">
        <ToolbarBtn title="Bold" onClick={() => wrap('**', '**', 'bold text')} icon={Bold} />
        <ToolbarBtn title="Italic" onClick={() => wrap('*', '*', 'italic text')} icon={Italic} />
        <Sep />
        <ToolbarBtn title="Bullet list" onClick={() => block('- List item')} icon={List} />
        <ToolbarBtn title="Numbered list" onClick={() => block('1. List item')} icon={ListOrdered} />
        <Sep />
        <ToolbarBtn
          title="Insert link"
          onClick={() => { setLinkState({ isOpen: true, url: '', text: '' }); setTimeout(() => linkUrlRef.current?.focus(), 0); }}
          icon={LinkIcon}
          active={linkState.isOpen}
        />
        <ToolbarBtn
          title="Insert image"
          onClick={() => setShowUploader(v => !v)}
          icon={ImageIcon}
          active={showUploader}
        />
        <ToolbarBtn title="Horizontal rule (---)" onClick={() => block('---')} icon={Minus} />
        <Sep />
        {/* Mode switcher */}
        <div className="flex items-center ml-auto bg-zinc-800 rounded-lg overflow-hidden divide-x divide-zinc-700">
          <ModeBtn label="Write" active={mode === 'write'} onClick={() => setMode('write')} />
          <ModeBtn label="Preview" active={mode === 'preview'} onClick={() => setMode('preview')} />
          <ModeBtn label="Split" active={mode === 'split'} onClick={() => setMode('split')} />
        </div>
      </div>

      {/* ── Link input row ── */}
      {linkState.isOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          <input
            type="text"
            placeholder="Link text (optional)"
            value={linkState.text}
            onChange={e => setLinkState(s => ({ ...s, text: e.target.value }))}
            className="w-32 bg-zinc-900 border border-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            ref={linkUrlRef}
            type="url"
            placeholder="https://example.com"
            value={linkState.url}
            onChange={e => setLinkState(s => ({ ...s, url: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && saveLink()}
            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <button onClick={saveLink} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded" title="Insert">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setLinkState({ isOpen: false, url: '', text: '' })} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Image uploader row ── */}
      {showUploader && (
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 relative">
          <button onClick={() => setShowUploader(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
          <ImageUploader onUpload={handleImageUploaded} width={800} />
        </div>
      )}

      {/* ── Editor / Preview panes ── */}
      <div className={`flex ${mode === 'split' ? 'divide-x divide-zinc-800' : ''}`}>

        {showWrite && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={"Write markdown here…\n\n• Press Enter twice for a new paragraph\n• Use --- on its own line for a horizontal rule\n• **bold**  *italic*  [link](url)"}
            spellCheck
            className={`
              bg-transparent text-zinc-100 text-sm leading-relaxed
              p-4 resize-none focus:outline-none font-mono placeholder:text-zinc-600
              ${mode === 'split' ? 'w-1/2' : 'w-full'}
            `}
            style={{ minHeight: '8rem' }}
          />
        )}

        {showPreview && (
          <div
            className={`
              p-4 text-sm leading-relaxed overflow-auto
              ${mode === 'split' ? 'w-1/2' : 'w-full'}
              [&>p]:mt-0 [&>p]:mb-3
              [&_strong]:text-white [&_strong]:font-bold
              [&_em]:text-zinc-300 [&_em]:italic
              [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-4 [&_a]:break-all hover:[&_a]:text-blue-300
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_img]:border [&_img]:border-zinc-700
              [&_code]:bg-zinc-800 [&_code]:text-blue-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:border [&_code]:border-zinc-700
              [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-3
              [&_pre>code]:bg-transparent [&_pre>code]:border-none [&_pre>code]:p-0 [&_pre>code]:text-zinc-300
              [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400 [&_blockquote]:my-3 [&_blockquote]:not-italic
              [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ul>li]:my-0.5 [&_ul>li]:text-zinc-200
              [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_ol>li]:my-0.5 [&_ol>li]:text-zinc-200
              [&_ol>li::marker]:text-blue-400 [&_ol>li::marker]:font-semibold
              [&_h1]:text-white [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-zinc-100 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-zinc-800 [&_h2]:pb-1
              [&_h3]:text-zinc-200 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
              [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-zinc-600 [&_hr]:my-5
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-sm
              [&_th]:bg-zinc-900 [&_th]:border [&_th]:border-zinc-700 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white
              [&_td]:border [&_td]:border-zinc-800 [&_td]:p-2 [&_td]:text-zinc-300
            `}
            dangerouslySetInnerHTML={{ __html: previewHtml || '<p style="color:#52525b;font-style:italic">Nothing to preview yet…</p>' }}
          />
        )}
      </div>

      {/* ── Hint bar ── */}
      <div className="px-3 py-1 bg-zinc-900/50 border-t border-zinc-800/50 text-[10px] text-zinc-600 flex flex-wrap gap-x-4 gap-y-0.5 select-none">
        <span><code className="text-zinc-500">**bold**</code></span>
        <span><code className="text-zinc-500">*italic*</code></span>
        <span><code className="text-zinc-500">[text](url)</code></span>
        <span><code className="text-zinc-500">![alt](url)</code></span>
        <span><code className="text-zinc-500">---</code> = horizontal line</span>
        <span>2× Enter = new paragraph</span>
      </div>
    </div>
  );
};

export default RichMarkdownEditor;
