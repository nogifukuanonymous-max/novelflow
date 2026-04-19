"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Toggle, RadioCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { ReadingMode } from "@/types";

/* ══════════════════════════════════════
   キャラクター型
══════════════════════════════════════ */
interface Char {
  id:     string;
  name:   string;
  yomi:   string;
  gender: "male" | "female" | "neutral";
  color:  string;
}

const INIT_CHARS: Char[] = [
  { id: "c1", name: "主人公", yomi: "しゅじんこう", gender: "neutral", color: "rgba(122,93,199,0.3)" },
  { id: "c2", name: "優一",   yomi: "ゆういち",     gender: "male",    color: "rgba(29,158,117,0.25)" },
];

const CHAR_COLORS = [
  "rgba(122,93,199,0.3)",
  "rgba(29,158,117,0.25)",
  "rgba(216,90,48,0.2)",
  "rgba(55,138,221,0.2)",
  "rgba(250,199,117,0.2)",
];

interface SlotItem {
  id:   string;
  type: "image" | "video";
  name: string;
}

/* ══════════════════════════════════════
   メインエディタ
══════════════════════════════════════ */
export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-bg" />}>
      <EditorInner />
    </Suspense>
  );
}

function EditorInner() {
  const [title, setTitle]         = useState("交差する夜明け");
  const [charCount, setCharCount] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isPublished, setIsPublished] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>("both");
  const [chars, setChars]         = useState<Char[]>(INIT_CHARS);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [editingChar, setEditingChar]     = useState<Char | null>(null);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagPopoverPos, setTagPopoverPos]   = useState({ x: 0, y: 0 });
  const [previewOpen, setPreviewOpen]       = useState(false);
  const [savedRange, setSavedRange]         = useState<Range | null>(null);

  // URL パラメータ（workId / episodeId）
  const searchParams = useSearchParams();
  const workId = searchParams.get("workId") ?? "";
  const [episodeId, setEpisodeId] = useState(searchParams.get("episodeId") ?? "");

  // 挿入済みスロット一覧
  const [slots, setSlots] = useState<SlotItem[]>([]);

  // トースト通知
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // サイドパネルセクション開閉
  const [secOpen, setSecOpen] = useState({ pub: true, mode: true, chars: true, slots: true });
  const toggleSec = (k: keyof typeof secOpen) =>
    setSecOpen(s => ({ ...s, [k]: !s[k] }));

  const editorRef     = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const imgInputRef   = useRef<HTMLInputElement>(null);
  const vidInputRef   = useRef<HTMLInputElement>(null);

  /* 初期コンテンツ */
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = buildInitialContent(chars);
    updateCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* 文字数カウント */
  const updateCount = useCallback(() => {
    const t = (editorRef.current?.innerText ?? "").replace(/\s/g, "").length;
    setCharCount(t + title.length);
  }, [title]);

  /* 自動保存スケジュール */
  const scheduleAutosave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    setSaveState("saving");
    autoSaveTimer.current = setTimeout(async () => {
      await new Promise(r => setTimeout(r, 400));
      setSaveState("saved");
      if (editorRef.current) {
        localStorage.setItem("nf_editor_title", title);
        localStorage.setItem("nf_editor_body", editorRef.current.innerHTML);
      }
    }, 1500);
  }, [title]);

  /* トースト自動消滅 */
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  /* 下書き保存（Supabase） */
  const saveDraft = useCallback(async () => {
    setSaveState("saving");
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      const bodyJson = { html: editorRef.current?.innerHTML ?? "" };

      if (user) {
        if (episodeId) {
          await client.from("episodes")
            .update({ title, body_json: bodyJson as never, is_published: false })
            .eq("id", episodeId);
        } else if (workId) {
          const { data } = await client.from("episodes")
            .insert({
              work_id:      workId,
              title,
              body_json:    bodyJson as never,
              is_published: false,
              sort_order:   0,
              char_count:   charCount,
            })
            .select("id")
            .single();
          if (data?.id) setEpisodeId(data.id as string);
        }
      }

      // ローカルにも保存
      localStorage.setItem("nf_editor_title", title);
      localStorage.setItem("nf_editor_body", editorRef.current?.innerHTML ?? "");

      setSaveState("saved");
      setToastMsg("下書きを保存しました");
    } catch {
      setSaveState("unsaved");
      setToastMsg("保存に失敗しました");
    }
  }, [title, episodeId, workId, charCount]);

  /* キーボードショートカット */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "b") { e.preventDefault(); document.execCommand("bold"); }
      if (k === "i") { e.preventDefault(); document.execCommand("italic"); }
      if (k === "u") { e.preventDefault(); document.execCommand("underline"); }
      if (k === "z" && !e.shiftKey) { e.preventDefault(); document.execCommand("undo"); }
      if (k === "z" &&  e.shiftKey) { e.preventDefault(); document.execCommand("redo"); }
      if (k === "y")               { e.preventDefault(); document.execCommand("redo"); }
      if (k === "s") { e.preventDefault(); void saveDraft(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [saveDraft]);

  /* ── 名前タグ挿入ポップオーバー ── */
  const openTagPopover = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) setSavedRange(sel.getRangeAt(0).cloneRange());
    const btn = document.getElementById("tagInsertBtn");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setTagPopoverPos({ x: r.left, y: r.bottom + 6 });
    setTagPopoverOpen(v => !v);
  };

  const insertNameTag = (char: Char) => {
    const html = `<span class="name-tag-inline" contenteditable="false" data-char-id="${char.id}">{{${char.name}_${char.yomi}}}</span>&nbsp;`;
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange);
      }
      document.execCommand("insertHTML", false, html);
    }
    setTagPopoverOpen(false);
    updateCount();
    scheduleAutosave();
  };

  /* ── ファイル選択してそのまま挿入 ── */
  const handleFileInsert = useCallback((file: File | undefined, type: "image" | "video") => {
    if (!file) return;

    // カーソル位置を保存（ファイル選択ダイアログ後にフォーカスが外れるため）
    const sel = window.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : savedRange;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const slotId   = `slot_${Date.now()}`;
      const slotNum  = slots.filter(s => s.type === type).length + 1;
      const slotName = type === "image" ? `画像${slotNum}` : `動画${slotNum}`;
      const badgeCls = type === "image"
        ? "background:rgba(133,183,235,0.2);color:#85b7eb;"
        : "background:rgba(240,153,123,0.2);color:#f0997b;";
      const badge    = type === "image" ? "画像スロット" : "動画スロット";
      const media    = type === "image"
        ? `<img src="${dataUrl}" alt="${slotName}" style="width:100%;max-height:380px;object-fit:cover;display:block;" />`
        : `<video src="${dataUrl}" controls style="width:100%;max-height:360px;display:block;"></video>`;

      const html = `
<div class="media-slot-block" contenteditable="false" data-slot-id="${slotId}" data-slot-type="${type}" data-slot-name="${slotName}"
  style="margin:20px 0;border-radius:12px;border:1.5px solid rgba(133,183,235,0.3);overflow:hidden;background:rgba(133,183,235,0.04);">
  ${media}
  <div style="padding:8px 12px;display:flex;align-items:center;justify-content:space-between;background:rgba(133,183,235,0.05);">
    <p data-slot-name-display style="font-size:12px;color:#85b7eb;margin:0;font-weight:500;">${slotName}</p>
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:9px;padding:2px 8px;border-radius:8px;${badgeCls}">${badge}</span>
      <button onclick="this.closest('.media-slot-block').remove()" style="font-size:10px;color:rgba(240,153,123,0.6);padding:2px 7px;border-radius:4px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.07);">削除</button>
    </div>
  </div>
</div>`;

      if (editorRef.current) {
        editorRef.current.focus();
        const curSel = window.getSelection();
        if (range) { curSel?.removeAllRanges(); curSel?.addRange(range); }
        document.execCommand("insertHTML", false, html);
      }
      setSlots(prev => [...prev, { id: slotId, type, name: slotName }]);
      updateCount();
      scheduleAutosave();
    };
    reader.readAsDataURL(file);
    // 同じファイルを再選択できるようリセット
    if (type === "image" && imgInputRef.current) imgInputRef.current.value = "";
    if (type === "video" && vidInputRef.current) vidInputRef.current.value = "";
  }, [slots, savedRange, updateCount, scheduleAutosave]);

  /* ── サイドパネルからスロット名を更新 ── */
  const updateSlotName = (slotId: string, name: string) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, name } : s));
    if (editorRef.current) {
      const el = editorRef.current.querySelector(`[data-slot-id="${slotId}"]`);
      if (el) {
        el.setAttribute("data-slot-name", name);
        const nameEl = el.querySelector("[data-slot-name-display]");
        if (nameEl) nameEl.textContent = name || "(名前未設定)";
      }
    }
  };

  /* ── エディタのスロットとstateを同期（削除検知） ── */
  const syncSlots = useCallback(() => {
    if (!editorRef.current) return;
    const existing = new Set(
      Array.from(editorRef.current.querySelectorAll("[data-slot-id]"))
        .map(el => el.getAttribute("data-slot-id")!)
    );
    setSlots(prev => prev.filter(s => existing.has(s.id)));
  }, []);

  /* ── ページめくりブロック挿入 ── */
  const insertPageBreak = () => {
    const html = `
<div class="page-break-block" contenteditable="false"
  style="margin:28px 0;border-radius:10px;background:linear-gradient(135deg,rgba(122,93,199,0.18),rgba(83,74,183,0.12));border:1.5px solid rgba(122,93,199,0.4);padding:14px 20px;display:flex;align-items:center;gap:14px;user-select:none;cursor:default;">
  <span style="font-size:22px;flex-shrink:0;">📖</span>
  <div style="flex:1;">
    <p style="font-size:14px;font-weight:700;color:rgba(197,179,255,0.95);margin:0 0 3px;letter-spacing:0.04em;">ページめくり</p>
    <p style="font-size:10px;color:rgba(197,179,255,0.5);margin:0;">ここで読者のページが切り替わります</p>
  </div>
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="rgba(197,179,255,0.5)" stroke-width="1.8" style="flex-shrink:0;"><path d="M6 3l5 5-5 5"/></svg>
</div>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    updateCount();
    scheduleAutosave();
  };

  /* ── キャラクター保存 ── */
  const saveChar = (name: string, yomi: string, gender: "male" | "female" | "neutral") => {
    if (editingChar) {
      setChars(cs => cs.map(c => c.id === editingChar.id ? { ...c, name, yomi, gender } : c));
    } else {
      if (chars.length >= 5) { alert("キャラクターは最大5名まで登録できます"); return; }
      setChars(cs => [...cs, { id: `c${Date.now()}`, name, yomi, gender, color: CHAR_COLORS[cs.length % CHAR_COLORS.length] }]);
    }
    setCharModalOpen(false);
    setEditingChar(null);
  };

  return (
    <div className="h-dvh flex flex-col bg-bg text-text-1 font-sans overflow-hidden">

      {/* ── トップバー ── */}
      <div className="flex items-center gap-2.5 px-4 h-12 bg-[#111019] border-b border-border flex-shrink-0">
        <Link href="/works/work-001"
          className="flex items-center gap-1.5 text-[11px] text-text-3 px-2 py-1 rounded-md bg-white/3 border border-border hover:text-text-2 hover:border-border-2 transition-all flex-shrink-0">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
          作品管理
        </Link>
        <div className="flex-1 text-[11px] text-text-3 truncate">
          花と雨の形而上学 <span className="text-text-3 mx-1">›</span>
          <span className="text-text-2">{title || "（タイトル未入力）"}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10.5px] flex-shrink-0",
          saveState === "saved"  ? "text-teal/80" :
          saveState === "saving" ? "text-amber/70" : "text-text-3"
        )}>
          {saveState === "saved"  && <><CheckIcon /> 自動保存済み</>}
          {saveState === "saving" && <><ClockIcon /> 保存中…</>}
        </div>
        <div className="text-[11px] text-text-3 px-3 border-x border-border flex-shrink-0">
          {charCount.toLocaleString()}字
        </div>
        <button onClick={() => void saveDraft()}
          className="text-[11px] px-3 py-1.5 rounded-2xl border border-border-2 text-text-2 hover:border-accent hover:text-accent-lt transition-all flex-shrink-0">
          下書き保存
        </button>
        <button onClick={() => alert("公開しました！")}
          className="text-[11px] px-4 py-1.5 rounded-2xl bg-accent-2 text-white hover:bg-accent transition-colors flex-shrink-0"
          style={{ boxShadow: "0 2px 10px rgba(83,74,183,0.3)" }}>
          公開する ›
        </button>
      </div>

      {/* ── メインレイアウト ── */}
      <div className="flex flex-1 min-h-0">

        {/* エディタ本体 */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* ツールバー */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[#111019] border-b border-border flex-shrink-0">

            {/* ↩ 戻る / ↪ やり直し */}
            <ToolGroup>
              <TbBtn title="元に戻す (Ctrl+Z)" onClick={() => document.execCommand("undo")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 7H11a4 4 0 010 8H7"/><path d="M3 7L6 4M3 7l3 3"/>
                </svg>
              </TbBtn>
              <TbBtn title="やり直し (Ctrl+Y)" onClick={() => document.execCommand("redo")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M13 7H5a4 4 0 000 8H9"/><path d="M13 7l-3-3M13 7l-3 3"/>
                </svg>
              </TbBtn>
            </ToolGroup>

            {/* 画像挿入 / 動画挿入 / ページめくり */}
            <ToolGroup>
              <button
                onClick={() => { const sel = window.getSelection(); if (sel?.rangeCount) setSavedRange(sel.getRangeAt(0).cloneRange()); imgInputRef.current?.click(); }}
                className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[10.5px] text-[#85b7eb] bg-blue/12 border border-blue/25 hover:bg-blue/20 transition-colors">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="2" width="12" height="10" rx="1.5"/><path d="M1 9l3-3 3 3 2-2 4 3"/></svg>
                画像挿入
              </button>
              <button
                onClick={() => { const sel = window.getSelection(); if (sel?.rangeCount) setSavedRange(sel.getRangeAt(0).cloneRange()); vidInputRef.current?.click(); }}
                className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[10.5px] text-[#f0997b] bg-coral/12 border border-coral/25 hover:bg-coral/20 transition-colors">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="2" width="10" height="10" rx="1.5"/><path d="M11 6l3-2v6l-3-2"/></svg>
                動画挿入
              </button>
              <button onClick={insertPageBreak}
                className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[10.5px] text-[#c5b3ff] bg-accent/12 border border-accent-lt/25 hover:bg-accent/22 transition-colors">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="1" y="1" width="5.5" height="12" rx="1"/>
                  <rect x="7.5" y="1" width="5.5" height="12" rx="1"/>
                </svg>
                📄 ページめくり
              </button>
            </ToolGroup>

            {/* プレビュー */}
            <ToolGroup>
              <button onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[10.5px] text-text-2 hover:bg-white/7 hover:text-text-1 transition-colors">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="3"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/></svg>
                👁 プレビュー
              </button>
            </ToolGroup>
          </div>

          {/* 本文エリア */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[700px] mx-auto px-8 py-6 pb-24">
              <input
                value={title}
                onChange={e => { setTitle(e.target.value); setSaveState("unsaved"); scheduleAutosave(); }}
                placeholder="エピソードタイトルを入力…"
                className="w-full bg-transparent border-none outline-none pb-4 mb-5 border-b border-border font-serif text-[22px] font-normal text-text-1 caret-accent-lt placeholder:text-text-3"
                style={{ fontFamily: "var(--font-serif)" }}
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="ここに本文を書いてください…"
                onInput={() => { updateCount(); setSaveState("unsaved"); scheduleAutosave(); syncSlots(); }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.execCommand("insertHTML", false, "<br><br>");
                  }
                }}
                className="min-h-[400px] text-[15px] leading-[2.1] text-text-1 outline-none caret-accent-lt"
                style={{ fontFamily: "'Noto Serif JP', serif", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            </div>
          </div>
        </div>

        {/* サイドパネル */}
        <div className="w-[220px] flex-shrink-0 bg-[#0f0e18] border-l border-border overflow-y-auto hidden lg:block">
          <SideSection title="公開設定" open={secOpen.pub} onToggle={() => toggleSec("pub")}>
            <div className="flex flex-col gap-3">
              <SideRow label="公開状態"><Toggle checked={isPublished} onChange={setIsPublished} /></SideRow>
              <SideRow label="予約投稿"><Toggle checked={isScheduled} onChange={setIsScheduled} /></SideRow>
              {isScheduled && (
                <input type="datetime-local"
                  className="w-full bg-bg-card2 border border-border rounded-md px-2 py-1.5 text-[10px] text-text-2 outline-none" />
              )}
              <select className="w-full mt-1 bg-bg-card2 border border-border-2 rounded-md px-2.5 py-1.5 text-[11px] text-text-2 appearance-none">
                <option>全年齢</option><option>R15</option><option>R18</option>
              </select>
            </div>
          </SideSection>

          <SideSection title="読書モード" open={secOpen.mode} onToggle={() => toggleSec("mode")}>
            <div className="flex flex-col gap-1">
              {(["both","scroll_only","flip_only"] as ReadingMode[]).map(m => (
                <RadioCard key={m} selected={readingMode === m} onClick={() => setReadingMode(m)}
                  label={m === "both" ? "両方可能" : m === "scroll_only" ? "縦スクロールのみ" : "ページめくりのみ"} />
              ))}
            </div>
          </SideSection>

          <SideSection title="名前変換キャラ" open={secOpen.chars} onToggle={() => toggleSec("chars")}>
            <div className="flex flex-col gap-1.5">
              {chars.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 bg-bg-card2 rounded-lg border border-border">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-medium text-accent-lt"
                    style={{ background: c.color }}>{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] text-text-1 truncate">{c.name}</p>
                    <p className="text-[9px] text-text-3">{c.yomi}</p>
                  </div>
                  <button onClick={() => { setEditingChar(c); setCharModalOpen(true); }}
                    className="text-[9.5px] text-text-3 hover:text-accent-lt transition-colors flex-shrink-0">編集</button>
                </div>
              ))}
              <button onClick={() => { setEditingChar(null); setCharModalOpen(true); }}
                className="text-[11px] text-accent py-1.5 rounded-lg border border-dashed border-accent-lt/25 hover:bg-accent-dim transition-colors mt-1">
                ＋ キャラクターを追加
              </button>
            </div>
          </SideSection>

          <SideSection title="スロット管理" open={secOpen.slots} onToggle={() => toggleSec("slots")}>
            {slots.length === 0 ? (
              <p className="text-[10px] text-text-3 text-center py-2 leading-relaxed">
                スロットが挿入されていません
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {slots.map(slot => (
                  <div key={slot.id} className="flex flex-col gap-1.5 p-2 bg-bg-card2 rounded-lg border border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px]">{slot.type === "image" ? "🖼️" : "🎬"}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                        style={slot.type === "image"
                          ? { background: "rgba(133,183,235,0.15)", color: "#85b7eb" }
                          : { background: "rgba(240,153,123,0.15)", color: "#f0997b" }}>
                        {slot.type === "image" ? "画像" : "動画"}
                      </span>
                    </div>
                    <input
                      value={slot.name}
                      onChange={e => updateSlotName(slot.id, e.target.value)}
                      placeholder="スロット名を入力"
                      className="input-dark text-[10.5px] w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </SideSection>

          <Link href="/works/work-001"
            className="flex items-center justify-between px-3.5 py-3 text-[11px] text-text-2 hover:bg-white/3 transition-colors border-t border-border">
            <span>作品情報・章管理</span>
            <span className="text-accent">›</span>
          </Link>
        </div>
      </div>

      {/* ── 名前タグ挿入ポップオーバー ── */}
      {tagPopoverOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setTagPopoverOpen(false)} />
          <div
            className="fixed z-50 bg-bg-card2 border border-accent-lt/30 rounded-xl py-2 shadow-2xl animate-pop-in min-w-[200px]"
            style={{ left: tagPopoverPos.x, top: tagPopoverPos.y }}
          >
            <p className="text-[9px] text-text-3 px-3 pb-2 uppercase tracking-widest">変換キャラクターを選ぶ</p>
            {chars.map(c => (
              <button key={c.id} onClick={() => insertNameTag(c)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent/12 transition-colors">
                <span className="text-[12px] text-text-1">{c.name}</span>
                <span className="text-[10px] font-mono text-accent-lt bg-accent/18 border border-accent-lt/25 px-1.5 py-0.5 rounded">
                  {`{{${c.name}_${c.yomi}}}`}
                </span>
              </button>
            ))}
            <div className="h-px bg-border mx-2 my-1" />
            <button onClick={() => { setCharModalOpen(true); setTagPopoverOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-accent hover:bg-accent/8 transition-colors">
              <span>＋</span><span>キャラクターを追加</span>
            </button>
          </div>
        </>
      )}

      {/* ── キャラクター追加・編集モーダル ── */}
      {charModalOpen && (
        <CharModal
          editing={editingChar}
          onSave={saveChar}
          onClose={() => { setCharModalOpen(false); setEditingChar(null); }}
        />
      )}

      {/* ── プレビュー ── */}
      {previewOpen && (
        <PreviewOverlay
          title={title}
          bodyHtml={editorRef.current?.innerHTML ?? ""}
          chars={chars}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* ── 隠しファイル入力 ── */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileInsert(e.target.files?.[0], "image")}
      />
      <input
        ref={vidInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => handleFileInsert(e.target.files?.[0], "video")}
      />

      {/* ── トースト通知 ── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1a1927] border border-teal/30 rounded-xl shadow-2xl text-[12.5px] text-teal whitespace-nowrap animate-pop-in">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8a5 5 0 1010 0A5 5 0 003 8z"/><path d="M6 8l1.5 1.5L10 6"/>
            </svg>
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   サブコンポーネント
══════════════════════════════════════ */
function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-0.5 pr-2 mr-1.5 border-r border-border last:border-r-0 last:pr-0 last:mr-0">
      {children}
    </div>
  );
}
function TbBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center text-text-2 hover:bg-white/7 hover:text-text-1 transition-colors">
      {children}
    </button>
  );
}
function TbBtnWide({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick}
      className="flex items-center gap-1.5 px-2 h-7 rounded-md text-[10.5px] text-text-2 hover:bg-white/7 hover:text-text-1 transition-colors">
      {children}
    </button>
  );
}
function SideSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/2 transition-colors">
        <span className="text-[10px] font-medium text-text-3 uppercase tracking-widest">{title}</span>
        <span className={cn("text-text-3 text-xs transition-transform", open ? "rotate-180" : "")}>∧</span>
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}
function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-2">{label}</span>
      {children}
    </div>
  );
}

/* ── キャラクターモーダル ── */
function CharModal({ editing, onSave, onClose }: {
  editing: Char | null;
  onSave: (name: string, yomi: string, gender: "male" | "female" | "neutral") => void;
  onClose: () => void;
}) {
  const [name,   setName]   = useState(editing?.name   ?? "");
  const [yomi,   setYomi]   = useState(editing?.yomi   ?? "");
  const [gender, setGender] = useState<"male"|"female"|"neutral">(editing?.gender ?? "neutral");
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-[400px] bg-bg-card2 border border-border-2 rounded-xl animate-pop-in">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <p className="text-[13px] font-medium text-text-1">{editing ? "キャラクターを編集" : "キャラクターを追加"}</p>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M3 3l10 10M13 3L3 13"/></svg>
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          <FormField label="キャラクター名">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例：主人公" className="input-dark" />
          </FormField>
          <FormField label="よみがな">
            <input value={yomi} onChange={e => setYomi(e.target.value)} placeholder="例：しゅじんこう" className="input-dark" />
          </FormField>
          <FormField label="性別（語尾変化用）">
            <select value={gender} onChange={e => setGender(e.target.value as typeof gender)} className="select-dark">
              <option value="neutral">指定なし</option>
              <option value="female">女性</option>
              <option value="male">男性</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-2 justify-end px-4 pb-4">
          <button onClick={onClose} className="text-[12px] px-4 py-2 rounded-xl border border-border-2 text-text-2 hover:text-text-1 transition-colors">
            キャンセル
          </button>
          <button onClick={() => { if (name.trim()) onSave(name.trim(), yomi, gender); }}
            className="text-[12px] px-4 py-2 rounded-xl bg-accent-2 text-white hover:bg-accent transition-colors">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] text-text-2 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

/* ── プレビューオーバーレイ（ページ対応） ── */
function PreviewOverlay({ title, bodyHtml, chars, onClose }: {
  title: string; bodyHtml: string; chars: Char[]; onClose: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);

  // 名前タグを置換し、ページ切り替えブロックで分割
  const processedHtml = bodyHtml.replace(
    /data-char-id="([^"]+)"[^>]*>{{[^}]+}}<\/span>/g,
    (_m, charId) => {
      const c = chars.find(x => x.id === charId);
      return `style="color:#c5b3ff;">${c?.name ?? "主人公"}</span>`;
    }
  );

  // ページ切り替えブロックで分割
  const pages = processedHtml
    .split(/<div class="page-break-block"[^>]*>[\s\S]*?<\/div>/g)
    .map(p => p.trim())
    .filter(Boolean);

  if (pages.length === 0) pages.push(processedHtml);

  const totalPages = pages.length;
  const currentPage = pages[pageIndex] ?? "";

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 h-12 bg-bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-text-2">👁 プレビュー</p>
          {totalPages > 1 && (
            <span className="text-[11px] text-accent-lt bg-accent/15 px-2.5 py-0.5 rounded-full border border-accent-lt/25">
              {pageIndex + 1} / {totalPages} ページ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setPageIndex(i => Math.max(0, i - 1))}
                disabled={pageIndex === 0}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-bg-card border border-border-2 text-text-2 hover:text-text-1 transition-colors disabled:opacity-30">
                ‹ 前ページ
              </button>
              <button
                onClick={() => setPageIndex(i => Math.min(totalPages - 1, i + 1))}
                disabled={pageIndex === totalPages - 1}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-bg-card border border-border-2 text-text-2 hover:text-text-1 transition-colors disabled:opacity-30">
                次ページ ›
              </button>
            </>
          )}
          <button onClick={onClose}
            className="text-[12px] px-3 py-1.5 rounded-lg bg-bg-card border border-border-2 text-text-2 hover:text-text-1 transition-colors">
            × 閉じる
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-6 py-8">
          {pageIndex === 0 && (
            <h1 className="font-serif text-[24px] font-normal text-text-1 mb-7 pb-5 border-b border-border"
              style={{ fontFamily: "var(--font-serif)" }}>{title}</h1>
          )}
          <div className="text-[16px] leading-[2.1] text-text-1"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
            dangerouslySetInnerHTML={{ __html: currentPage }} />
        </div>
      </div>

      {/* ページネーション（フッター） */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-border bg-bg-card flex-shrink-0">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPageIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === pageIndex ? "bg-accent scale-125" : "bg-white/20 hover:bg-white/40"
              )} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 初期コンテンツ ── */
function buildInitialContent(chars: Char[]) {
  const tag = (c: Char) =>
    `<span class="name-tag-inline" contenteditable="false" data-char-id="${c.id}">{{${c.name}_${c.yomi}}}</span>`;
  return `<p>　夜明け前の空港に、${tag(chars[0])}の姿があった。スーツケースを引きながら振り返ったとき、ガラス窓の向こうに白み始めた空が映っていた。</p><p><br></p><p>　「もう行くの？」声は思ったより小さく出た。${tag(chars[1])}は答えず、ただ静かに微笑んだ。</p>`;
}

/* ── アイコン ── */
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 7a5 5 0 1010 0A5 5 0 002 7z"/><path d="M5 7l1.5 1.5L9 5"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="7" cy="7" r="5"/><path d="M7 4v3l2 1"/>
  </svg>
);
