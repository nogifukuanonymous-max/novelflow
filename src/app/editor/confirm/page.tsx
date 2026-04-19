"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/* ══════════════════════════════════════
   型
══════════════════════════════════════ */
interface SlotImage {
  id:       string;   // src の先頭 50 文字をキーにする
  src:      string;
  slotName: string;
}

/* ══════════════════════════════════════
   公開確認ページ
══════════════════════════════════════ */
export default function ConfirmPage() {
  const router = useRouter();

  const [title,    setTitle]    = useState("（タイトル未入力）");
  const [bodyHtml, setBodyHtml] = useState("");
  const [images,   setImages]   = useState<SlotImage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [toast,    setToast]    = useState<string | null>(null);

  /* localStorage から読み込み */
  useEffect(() => {
    const t = localStorage.getItem("nf_editor_title") ?? "（タイトル未入力）";
    const b = localStorage.getItem("nf_editor_body")  ?? "";
    setTitle(t);
    setBodyHtml(b);

    /* img タグを抽出 */
    const imgRe = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    const found: SlotImage[] = [];
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = imgRe.exec(b)) !== null) {
      found.push({ id: `img_${idx}`, src: m[1], slotName: `画像${idx + 1}` });
      idx++;
    }
    setImages(found);
  }, []);

  /* トースト自動消滅 */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ページ分割（page-break-block で分割） */
  const pages = bodyHtml
    .split(/<div class="page-break-block"[^>]*>[\s\S]*?<\/div>/g)
    .map(p => p.trim())
    .filter(Boolean);
  if (pages.length === 0) pages.push(bodyHtml);
  const totalPages = pages.length;

  /* 下書き保存 */
  const saveDraft = useCallback(async () => {
    setSaveState("saving");
    try {
      const client = createClient();
      const bodyJson = { html: bodyHtml };
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("episodes")
          .insert({ title, body_json: bodyJson as never, is_published: false, sort_order: 0, work_id: "" })
          .select("id").single();
      }
      localStorage.setItem("nf_editor_title", title);
      localStorage.setItem("nf_editor_body",  bodyHtml);
      setSaveState("done");
      setToast("下書きを保存しました");
    } catch {
      setSaveState("error");
      setToast("保存に失敗しました");
    }
  }, [title, bodyHtml]);

  /* 公開 */
  const publish = useCallback(async () => {
    setSaveState("saving");
    try {
      const client = createClient();
      const bodyJson = { html: bodyHtml };
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client.from("episodes")
          .insert({ title, body_json: bodyJson as never, is_published: true, sort_order: 0, work_id: "" })
          .select("id").single();
      }
      setSaveState("done");
      setToast("公開しました！");
      setTimeout(() => router.push("/mypage"), 1500);
    } catch {
      setSaveState("error");
      setToast("公開に失敗しました");
    }
  }, [title, bodyHtml, router]);

  return (
    <div className="min-h-dvh bg-bg text-text-1 flex flex-col">

      {/* トップバー */}
      <div className="flex items-center gap-3 px-5 h-12 bg-[#111019] border-b border-border flex-shrink-0">
        <Link href="/editor"
          className="flex items-center gap-1.5 text-[11px] text-text-3 px-2.5 py-1 rounded-md bg-white/3 border border-border hover:text-text-2 transition-all">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
          エディタに戻る
        </Link>
        <span className="text-[12px] text-text-2 flex-1 truncate">{title}</span>
        <span className="text-[10.5px] text-text-3">公開前の確認</span>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── 左：プレビュー ── */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[#0d0c16]">
          <div className="max-w-[660px] mx-auto px-6 py-8">

            {/* ページ切り替えバー */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-6 p-3 bg-bg-card rounded-xl border border-border">
                <button
                  onClick={() => setPageIndex(i => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-bg-card2 border border-border text-text-2 disabled:opacity-30 hover:text-text-1 transition-colors">
                  ‹ 前
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPageIndex(i)}
                      className={cn("w-2 h-2 rounded-full transition-all",
                        i === pageIndex ? "bg-accent scale-125" : "bg-white/20 hover:bg-white/40")} />
                  ))}
                  <span className="text-[10.5px] text-text-3 ml-2">{pageIndex + 1} / {totalPages}</span>
                </div>
                <button
                  onClick={() => setPageIndex(i => Math.min(totalPages - 1, i + 1))}
                  disabled={pageIndex === totalPages - 1}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-bg-card2 border border-border text-text-2 disabled:opacity-30 hover:text-text-1 transition-colors">
                  次 ›
                </button>
              </div>
            )}

            {/* タイトル（1ページ目のみ） */}
            {pageIndex === 0 && (
              <h1 className="font-serif text-[22px] font-normal text-text-1 mb-6 pb-5 border-b border-border"
                style={{ fontFamily: "var(--font-serif)" }}>
                {title}
              </h1>
            )}

            {/* 本文 */}
            <div
              className="text-[15px] leading-[2.1] text-text-1 preview-body"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
              dangerouslySetInnerHTML={{ __html: pages[pageIndex] ?? "" }}
            />
          </div>
        </div>

        {/* ── 右：操作パネル ── */}
        <div className="w-[280px] flex-shrink-0 bg-[#0f0e18] border-l border-border overflow-y-auto flex flex-col">

          {/* ① 下書き保存 */}
          <PanelSection title="下書き保存" icon="💾">
            <p className="text-[10.5px] text-text-3 mb-3 leading-relaxed">
              内容をSupabaseに保存します。公開はしません。
            </p>
            <button
              onClick={() => void saveDraft()}
              disabled={saveState === "saving"}
              className="w-full py-2 rounded-xl border border-border-2 text-[12px] text-text-2 hover:text-text-1 hover:border-accent/40 transition-all disabled:opacity-50">
              {saveState === "saving" ? "保存中…" : "下書きを保存"}
            </button>
          </PanelSection>

          {/* ② 画像スロット管理 */}
          <PanelSection title="画像のファイル化" icon="🖼️">
            {images.length === 0 ? (
              <p className="text-[10.5px] text-text-3 leading-relaxed">
                挿入済みの画像がありません
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {images.map((img, i) => (
                  <div key={img.id} className="flex flex-col gap-1.5">
                    {/* サムネイル */}
                    <div className="w-full h-[80px] rounded-lg overflow-hidden bg-bg-card border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.slotName} className="w-full h-full object-cover" />
                    </div>
                    {/* スロット名入力 */}
                    <input
                      value={img.slotName}
                      onChange={e => setImages(prev => prev.map((im, j) =>
                        j === i ? { ...im, slotName: e.target.value } : im
                      ))}
                      placeholder="スロット名（例：有村架純①）"
                      className="input-dark text-[10.5px] w-full"
                    />
                  </div>
                ))}

                <button
                  onClick={() => setToast("パックファイルの作成機能は近日公開予定です")}
                  className="w-full py-2 mt-1 rounded-xl border border-blue/30 text-[12px] text-[#85b7eb] bg-blue/8 hover:bg-blue/15 transition-all">
                  📦 パックファイルを作成
                </button>
              </div>
            )}
          </PanelSection>

          {/* ③ 公開ボタン */}
          <div className="p-4 mt-auto border-t border-border">
            <p className="text-[10px] text-text-3 mb-3 leading-relaxed">
              公開すると読者が読めるようになります。<br />
              後から下書きに戻すことも可能です。
            </p>
            <button
              onClick={() => void publish()}
              disabled={saveState === "saving"}
              className="w-full py-3 rounded-2xl bg-accent-2 text-white text-[13px] font-medium hover:bg-accent transition-colors disabled:opacity-50"
              style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.35)" }}>
              {saveState === "saving" ? "公開中…" : "✓ 公開する"}
            </button>
          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1a1927] border border-teal/30 rounded-xl shadow-2xl text-[12.5px] text-teal whitespace-nowrap animate-pop-in">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8a5 5 0 1010 0A5 5 0 003 8z"/><path d="M6 8l1.5 1.5L10 6"/>
            </svg>
            {toast}
          </div>
        </div>
      )}

      {/* img タグのスロット名ラベルを読者側で非表示にするグローバルスタイル */}
      <style>{`
        .preview-body img { max-width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
        .preview-body video { max-width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════
   サブコンポーネント
══════════════════════════════════════ */
function PanelSection({ title, icon, children }: {
  title: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[14px]">{icon}</span>
        <span className="text-[10px] font-medium text-text-3 uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}
