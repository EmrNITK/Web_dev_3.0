import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Image as ImageIcon, X, Check, Unlink, Minus } from "lucide-react";
import { marked } from "marked";
import TurndownService from "turndown";
import ImageUploader from "./ImageUploader";

marked.setOptions({ breaks: true, gfm: true });

const preprocessMarkdown = (md) => {
  if (!md) return "";
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (_, alt, src, widthAttr) => {
    let w = widthAttr.replace("width=", "").trim();
    if (!w.endsWith("%") && !w.endsWith("px") && !w.endsWith("vw")) w += "%";
    return `<img src="${src}" alt="${alt}" style="width:${w};max-width:100%;" />`;
  });
};

const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });

turndownService.addRule("blankParagraph", {
  filter: (node) => {
    if (node.nodeName !== "P" && node.nodeName !== "DIV") return false;
    const clone = node.cloneNode(true);
    clone.querySelectorAll("br").forEach(b => b.remove());
    return clone.textContent.trim() === "" && !clone.querySelector("img");
  },
  replacement: () => "\n\n",
});

turndownService.addRule("lineBreak", { filter: "br", replacement: () => "  \n" });

turndownService.addRule("resizableImage", {
  filter: "img",
  replacement: (content, node) => {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const width = node.style.width || node.getAttribute("width");
    return width ? `![${alt}](${src}){width=${width}}` : `![${alt}](${src})`;
  },
});

const ToolbarButton = ({ onClick, active, icon: Icon, title }) => (
  <button type="button" onMouseDown={onClick} title={title}
    className={`p-1.5 rounded transition-colors ${active ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`}>
    <Icon className="w-4 h-4" />
  </button>
);

const Sep = () => <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />;

const RichMarkdownEditor = ({ initialValue = "", onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const linkInputRef = useRef(null);
  const [showUploader, setShowUploader] = useState(false);
  const [savedRange, setSavedRange] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [imgRect, setImgRect] = useState(null);
  const [linkState, setLinkState] = useState({ isOpen: false, url: "", targetNode: null });
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, insertUnorderedList: false, insertOrderedList: false, link: false });

  useEffect(() => {
    if (editorRef.current && initialValue && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = marked.parse(preprocessMarkdown(initialValue));
    }
  }, [initialValue]);

  const syncImgRect = useCallback(() => {
    if (selectedImg && editorRef.current) {
      const edRect = editorRef.current.getBoundingClientRect();
      const imgR = selectedImg.getBoundingClientRect();
      setImgRect({ top: imgR.top - edRect.top + editorRef.current.scrollTop, left: imgR.left - edRect.left + editorRef.current.scrollLeft, width: imgR.width, height: imgR.height });
    } else { setImgRect(null); }
  }, [selectedImg]);

  useEffect(() => {
    syncImgRect();
    window.addEventListener("resize", syncImgRect);
    return () => window.removeEventListener("resize", syncImgRect);
  }, [syncImgRect]);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      syncImgRect();
      onChange(turndownService.turndown(editorRef.current.innerHTML));
    }
  }, [onChange, syncImgRect]);

  const updateActiveStates = useCallback((e) => {
    if (e?.target?.tagName === "IMG") { setSelectedImg(e.target); }
    else if (e?.type === "mouseup") { setSelectedImg(null); }
    const formats = ["bold", "italic", "insertUnorderedList", "insertOrderedList"];
    const newStates = {};
    formats.forEach(cmd => { newStates[cmd] = document.queryCommandState(cmd); });
    const sel = window.getSelection();
    let isLink = false;
    if (sel?.rangeCount > 0) {
      let node = sel.focusNode;
      while (node && node !== editorRef.current) { if (node.nodeName === "A") { isLink = true; break; } node = node.parentNode; }
    }
    newStates.link = isLink;
    setActiveFormats(newStates);
  }, []);

  const handleKeyDown = (e) => {
    if (selectedImg && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault(); selectedImg.remove(); setSelectedImg(null); setImgRect(null); handleInput();
    }
  };

  const executeCommand = (command, value = null) => {
    if (editorRef.current) { editorRef.current.focus(); document.execCommand(command, false, value); updateActiveStates(); handleInput(); }
  };

  const insertHR = (e) => {
    e.preventDefault();
    if (editorRef.current) { editorRef.current.focus(); document.execCommand("insertHTML", false, "<hr/>"); handleInput(); }
  };

  const openLinkEditor = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel?.rangeCount > 0) setSavedRange(sel.getRangeAt(0));
    let node = sel?.focusNode, existingLink = null;
    while (node && node !== editorRef.current) { if (node.nodeName === "A") { existingLink = node; break; } node = node.parentNode; }
    setLinkState({ isOpen: true, url: existingLink?.getAttribute("href") || "", targetNode: existingLink });
    setTimeout(() => linkInputRef.current?.focus(), 0);
  };

  const saveLink = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange && !linkState.targetNode) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
      if (linkState.url) { linkState.targetNode ? linkState.targetNode.setAttribute("href", linkState.url) : executeCommand("createLink", linkState.url); handleInput(); }
    }
    setLinkState({ isOpen: false, url: "", targetNode: null }); setSavedRange(null);
  };

  const removeLink = () => {
    if (linkState.targetNode) { const text = document.createTextNode(linkState.targetNode.textContent); linkState.targetNode.parentNode.replaceChild(text, linkState.targetNode); handleInput(); }
    setLinkState({ isOpen: false, url: "", targetNode: null });
  };

  const handleImageUploaded = (url) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
      executeCommand("insertHTML", `<img src="${url}" alt="Image" style="width:50%;max-width:100%;" />`);
    }
    setShowUploader(false); setSavedRange(null);
  };

  const startImageResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedImg || !editorRef.current) return;
    const startX = e.clientX, startWidthPx = selectedImg.getBoundingClientRect().width, containerWidth = editorRef.current.getBoundingClientRect().width;
    const onMouseMove = (mv) => { const newPx = Math.max(50, startWidthPx + (mv.clientX - startX)); selectedImg.style.width = `${Math.min(100, (newPx / containerWidth) * 100).toFixed(2)}%`; selectedImg.removeAttribute("width"); syncImgRect(); };
    const onMouseUp = () => { document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp); handleInput(); };
    document.addEventListener("mousemove", onMouseMove); document.addEventListener("mouseup", onMouseUp);
  };

  const handleContainerBlur = (e) => {
    if (showUploader) return;
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) { setSelectedImg(null); setShowUploader(false); setLinkState({ isOpen: false, url: "", targetNode: null }); }
  };

  return (
    <div ref={containerRef} onBlur={handleContainerBlur} tabIndex={-1} className="flex flex-col w-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950/40 outline-none">
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-zinc-900 border-b border-zinc-800 flex-wrap">
        <ToolbarButton onClick={(e) => { e.preventDefault(); executeCommand("bold"); }} active={activeFormats.bold} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={(e) => { e.preventDefault(); executeCommand("italic"); }} active={activeFormats.italic} icon={Italic} title="Italic (Ctrl+I)" />
        <ToolbarButton onClick={openLinkEditor} active={activeFormats.link || linkState.isOpen} icon={LinkIcon} title="Link" />
        <Sep />
        <ToolbarButton onClick={(e) => { e.preventDefault(); executeCommand("insertUnorderedList"); }} active={activeFormats.insertUnorderedList} icon={List} title="Bullet List" />
        <ToolbarButton onClick={(e) => { e.preventDefault(); executeCommand("insertOrderedList"); }} active={activeFormats.insertOrderedList} icon={ListOrdered} title="Numbered List" />
        <ToolbarButton onClick={insertHR} active={false} icon={Minus} title="Horizontal Rule" />
        <Sep />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); const sel = window.getSelection(); if (sel?.rangeCount > 0) setSavedRange(sel.getRangeAt(0)); setShowUploader(v => !v); }}
          className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${showUploader ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`} title="Insert Image">
          <ImageIcon className="w-4 h-4" /><span className="hidden sm:inline">Image</span>
        </button>
        <span className="ml-auto text-[10px] text-zinc-600 select-none hidden sm:block">Enter = new paragraph · Shift+Enter = line break</span>
      </div>

      {linkState.isOpen && (
        <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center gap-2">
          <input ref={linkInputRef} type="url" value={linkState.url} onChange={(e) => setLinkState({ ...linkState, url: e.target.value })} placeholder="https://example.com"
            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-500" onKeyDown={(e) => e.key === "Enter" && saveLink()} />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); saveLink(); }} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded"><Check className="w-4 h-4" /></button>
          {linkState.targetNode && <button type="button" onMouseDown={(e) => { e.preventDefault(); removeLink(); }} className="p-1.5 bg-red-500/10 text-red-400 rounded"><Unlink className="w-4 h-4" /></button>}
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setLinkState({ isOpen: false, url: "", targetNode: null }); }} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showUploader && (
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 relative">
          <button type="button" onMouseDown={() => setShowUploader(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
          <ImageUploader onUpload={handleImageUploaded} width={800} />
        </div>
      )}

      <div className="relative w-full">
        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyUp={updateActiveStates} onMouseUp={updateActiveStates} onKeyDown={handleKeyDown}
          className="w-full min-h-[5rem] p-4 bg-transparent text-zinc-100 focus:outline-none leading-relaxed text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-1 [&_li]:my-0.5 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-white [&_strong]:font-bold [&_em]:italic [&_em]:text-zinc-300 [&_hr]:border-t [&_hr]:border-zinc-600 [&_hr]:my-3 [&_img]:inline-block [&_img]:align-bottom [&_img]:mx-1 [&_img]:rounded-md [&_img]:cursor-pointer [&_img]:border [&_img]:border-zinc-700 [&_p]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400 [&_blockquote]:my-2 [&_code]:bg-zinc-800 [&_code]:text-blue-300 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs"
        />
        {selectedImg && imgRect && (
          <div style={{ position: "absolute", top: imgRect.top, left: imgRect.left, width: imgRect.width, height: imgRect.height, border: "2px solid #3b82f6", pointerEvents: "none", zIndex: 10 }}>
            <div style={{ position: "absolute", bottom: -6, right: -6, width: 14, height: 14, backgroundColor: "#3b82f6", border: "2px solid white", borderRadius: "50%", cursor: "nwse-resize", pointerEvents: "auto" }} onMouseDown={startImageResize} />
          </div>
        )}
      </div>

      <div className="px-3 py-1 bg-zinc-900/50 border-t border-zinc-800/50 text-[10px] text-zinc-600 flex flex-wrap gap-x-4 select-none">
        <span><strong className="text-zinc-500">Ctrl+B</strong> bold</span>
        <span><strong className="text-zinc-500">Ctrl+I</strong> italic</span>
        <span><strong className="text-zinc-500">Enter</strong> new paragraph</span>
        <span><strong className="text-zinc-500">Shift+Enter</strong> line break</span>
        <span>HR button inserts horizontal line</span>
      </div>
    </div>
  );
};

export default RichMarkdownEditor;
