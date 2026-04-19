"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ══════════════════════════════════════
   公開確認ページ
══════════════════════════════════════ */
export default function ConfirmPage() {
  const router = useRouter();

  const [title,    setTitle]    = useState("（タイトル未入力）");
  const [bodyHtml, setBodyHtml] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [toast,    setToast]    = useState<string | null>(null);

  /* localStorage から読み込み */
  useEffect(() => {
    const t = localStorage.getItem("nf_editor_title") ?? "（タイトル未入力）";
    const b = localStorage.getItem("nf_editor_body")  ?? "";
    setTitle(t);
    setBodyHtml(b);
  }, []);

  /* トースト自動消滅 */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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

  /* パックなしで公開 */
  const publishWithoutPack = useCallback(async () => {
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

  /* パックあり公開 */
  const publishWithPack = useCallback(async () => {
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

      {/* コンテンツ */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[480px] flex flex-col gap-4">

          {/* タイトル表示 */}
          <div className="px-4 py-3 bg-bg-card rounded-xl border border-border">
            <p className="text-[9.5px] text-text-3 uppercase tracking-widest mb-1">タイトル</p>
            <p className="text-[15px] text-text-1 font-serif">{title}</p>
          </div>

          {/* プレビューボタン */}
          <Link href="/editor/preview"
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/4 text-[13px] text-text-1 hover:bg-white/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
            </svg>
            プレビューを見る
          </Link>

          {/* 下書き保存 */}
          <div className="px-4 py-4 bg-bg-card rounded-xl border border-border">
            <p className="text-[9.5px] text-text-3 uppercase tracking-widest mb-2">下書き保存</p>
            <p className="text-[10.5px] text-text-3 mb-3 leading-relaxed">
              内容をSupabaseに保存します。公開はしません。
            </p>
            <button
              onClick={() => void saveDraft()}
              disabled={saveState === "saving"}
              className="w-full py-2 rounded-xl border border-border-2 text-[12px] text-text-2 hover:text-text-1 hover:border-accent/40 transition-all disabled:opacity-50">
              {saveState === "saving" ? "保存中…" : "下書きを保存"}
            </button>
          </div>

          {/* 公開セクション */}
          <div className="px-4 py-4 bg-bg-card rounded-xl border border-border flex flex-col gap-3">
            <p className="text-[9.5px] text-text-3 uppercase tracking-widest">公開する</p>
            <p className="text-[10px] text-text-3 leading-relaxed">
              公開すると読者が読めるようになります。後から下書きに戻すことも可能です。
            </p>

            {/* パックなしで公開 */}
            <button
              onClick={() => void publishWithoutPack()}
              disabled={saveState === "saving"}
              className="w-full py-3 rounded-2xl border border-white/20 bg-white/6 text-white text-[13px] font-medium hover:bg-white/12 transition-colors disabled:opacity-50">
              {saveState === "saving" ? "公開中…" : "画像をそのまま公開"}
            </button>

            {/* パックあり公開（メイン） */}
            <button
              onClick={() => void publishWithPack()}
              disabled={saveState === "saving"}
              className="w-full py-3 rounded-2xl bg-accent-2 text-white text-[13px] font-medium hover:bg-accent transition-colors disabled:opacity-50"
              style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.35)" }}>
              {saveState === "saving" ? "公開中…" : "✓ 公開する（パックあり）"}
            </button>

            <p className="text-[9.5px] text-text-3 text-center leading-relaxed">
              「パックあり」はメディアパックを読者が購入・適用して楽しむ形式です
            </p>
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
    </div>
  );
}
