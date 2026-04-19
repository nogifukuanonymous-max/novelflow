"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EditorPreviewPage() {
  const [title,    setTitle]    = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [font,     setFont]     = useState<"mincho" | "gothic">("mincho");
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    setTitle(localStorage.getItem("nf_editor_title") ?? "（タイトル未入力）");
    setBodyHtml(localStorage.getItem("nf_editor_body") ?? "");
  }, []);

  /* page-break-block でページ分割 */
  const pages = bodyHtml
    .split(/<div class="page-break-block"[^>]*>[\s\S]*?<\/div>/g)
    .map(p => p.trim())
    .filter(Boolean);
  if (pages.length === 0) pages.push(bodyHtml);

  const totalPages = pages.length;
  const fontFamily = font === "mincho" ? "'Noto Serif JP',serif" : "'Noto Sans JP',sans-serif";

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f0e14] text-white">

      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 h-12 bg-[#0f0e14]/95 backdrop-blur-sm border-b border-white/8 flex-shrink-0 z-10">
        <Link href="/editor/confirm"
          className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition-colors">
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
          確認ページへ戻る
        </Link>
        <div className="flex items-center gap-2">
          {/* フォント切替 */}
          <div className="flex gap-0.5 p-0.5 bg-white/5 border border-white/10 rounded-full">
            {(["mincho", "gothic"] as const).map(f => (
              <button key={f} onClick={() => setFont(f)}
                className={cn("text-[10px] px-2.5 py-1 rounded-full transition-all",
                  font === f ? "bg-accent-2 text-white" : "text-white/40")}>
                {f === "mincho" ? "明朝" : "ゴシック"}
              </button>
            ))}
          </div>
          {/* フォントサイズ */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFontSize(s => Math.max(12, s - 1))}
              className="w-6 h-6 rounded-full bg-white/8 text-white/50 text-[13px] flex items-center justify-center hover:bg-white/15 transition-colors">
              −
            </button>
            <span className="text-[11px] text-white/40 w-8 text-center">{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(24, s + 1))}
              className="w-6 h-6 rounded-full bg-white/8 text-white/50 text-[13px] flex items-center justify-center hover:bg-white/15 transition-colors">
              ＋
            </button>
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-6 py-8">
          {pageIndex === 0 && title && (
            <h1 className="font-serif text-[22px] font-normal text-white mb-8 pb-6 border-b border-white/10"
              style={{ fontFamily }}>
              {title}
            </h1>
          )}
          <div
            className="leading-[2.1] text-white/90"
            style={{ fontFamily, fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: pages[pageIndex] ?? "" }}
          />
        </div>
      </div>

      {/* ページナビ（フッター） */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 bg-[#0f0e14]/95 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setPageIndex(i => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
            className="text-[12px] px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/60 disabled:opacity-30 hover:text-white/90 transition-colors">
            ‹ 前のページ
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPageIndex(i)}
                className={cn("w-2 h-2 rounded-full transition-all",
                  i === pageIndex ? "bg-accent scale-125" : "bg-white/20 hover:bg-white/40")} />
            ))}
          </div>
          <button
            onClick={() => setPageIndex(i => Math.min(totalPages - 1, i + 1))}
            disabled={pageIndex === totalPages - 1}
            className="text-[12px] px-4 py-2 rounded-xl bg-white/6 border border-white/10 text-white/60 disabled:opacity-30 hover:text-white/90 transition-colors">
            次のページ ›
          </button>
        </div>
      )}

      {/* 透明タップゾーン（左右ページ送り） */}
      {totalPages > 1 && (
        <div className="absolute inset-0 z-0 flex pointer-events-none" style={{ top: "48px", bottom: totalPages > 1 ? "52px" : "0" }}>
          <div className="flex-1 h-full pointer-events-auto cursor-pointer"
            onClick={() => setPageIndex(i => Math.max(0, i - 1))} />
          <div className="flex-1 h-full pointer-events-auto cursor-pointer"
            onClick={() => setPageIndex(i => Math.min(totalPages - 1, i + 1))} />
        </div>
      )}

      <style>{`
        .leading-\\[2\\.1\\] img { max-width:100%; border-radius:8px; margin:8px 0; display:block; }
        .leading-\\[2\\.1\\] video { max-width:100%; border-radius:8px; margin:8px 0; display:block; }
      `}</style>
    </div>
  );
}
