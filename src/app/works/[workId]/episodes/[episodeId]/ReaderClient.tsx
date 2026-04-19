"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Work, Episode, Chapter } from "@/types";
import { useNameStore, useReaderSettings, useProgressStore } from "@/lib/store";
import { applyNameTransform, cn } from "@/lib/utils";

/* ══════════════════════════════════════
   モック本文ページデータ
══════════════════════════════════════ */
const PAGES = [
  { bg: "linear-gradient(135deg,#1e1040 0%,#6b3a8a 40%,#3a1a60 100%)", label: "夜明けの空港ロビー", hasMedia: true,
    text: "　夜明け前の空港に、{{主人公_しゅじんこう}}の姿があった。スーツケースを引きながら振り返ったとき、ガラス窓の向こうに白み始めた空が映っていた。" },
  { bg: "linear-gradient(135deg,#0e1422 0%,#1a3060 50%,#0e1422 100%)", label: null, hasMedia: false,
    text: "　「もう行くの？」\n\n　声は思ったより小さく出た。{{優一_ゆういち}}は答えず、ただ静かに微笑んだ。その笑顔が、三年前と少しも変わっていないことに気づいて、{{主人公_しゅじんこう}}は胸が痛んだ。" },
  { bg: "linear-gradient(135deg,#1a0f2e 0%,#4a2a6a 50%,#1a0f2e 100%)", label: "出発ゲートの灯り", hasMedia: true,
    text: "　窓の外では地上スタッフが忙しなく動き回っていた。出発まで、あと十五分。\n\n　{{主人公_しゅじんこう}}はその背中を見つめながら、三年前の春を思い出していた。" },
  { bg: "linear-gradient(135deg,#0f1820 0%,#1d4a3a 50%,#0f1820 100%)", label: null, hasMedia: false,
    text: "　「また会える？」\n\n　あのとき言えなかった言葉が、今になってようやく口をついた。{{優一_ゆういち}}は少し驚いたように目を見開き、それからゆっくりと頷いた。" },
  { bg: "linear-gradient(135deg,#20101a 0%,#6a2040 50%,#20101a 100%)", label: "搭乗ゲート", hasMedia: true,
    text: "　「うん。また会おう」\n\n　その一言で十分だった。{{主人公_しゅじんこう}}は初めて、自分が何を求めていたかを理解した。" },
  { bg: "linear-gradient(135deg,#1a1020 0%,#534ab7 50%,#1a1020 100%)", label: "夜明けの光", hasMedia: false,
    text: "　搭乗ゲートの向こうで、東の空が燃えるように色づき始めた。{{優一_ゆういち}}の後ろ姿が遠ざかっていく。{{主人公_しゅじんこう}}はその場に立ち尽くしたまま、次の春を待つことにした。" },
];

/* ══════════════════════════════════════
   メインコンポーネント
══════════════════════════════════════ */
interface Props {
  work: Work;
  episode: Episode;
  chapters: Chapter[];
  prevEpisode: Episode | null;
  nextEpisode: Episode | null;
}

export function ReaderClient({ work, episode, chapters, prevEpisode, nextEpisode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initMode = (searchParams.get("mode") as "flip" | "scroll") ?? "flip";

  const [mode, setMode] = useState<"flip" | "scroll">(initMode);
  const [currentPage, setCurrentPage] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"display" | "name" | "other">("display");
  const [tocOpen, setTocOpen] = useState(false);

  const headerTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { getNameMap, setName, resetNames } = useNameStore();
  const nameMap = getNameMap(work.id);
  const { fontSize, lineHeight, font, themeBg, themeTxt, setFontSize, setLineHeight, setFont, setTheme } = useReaderSettings();
  const { saveProgress } = useProgressStore();

  /* 名前変換適用 */
  const transformText = useCallback((text: string) => {
    return applyNameTransform(text, work.nameChars, nameMap);
  }, [work.nameChars, nameMap]);

  /* ヘッダー自動非表示 */
  const showHeader = useCallback(() => {
    setHeaderVisible(true);
    clearTimeout(headerTimer.current);
    if (mode === "flip") {
      headerTimer.current = setTimeout(() => setHeaderVisible(false), 3000);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "flip") {
      headerTimer.current = setTimeout(() => setHeaderVisible(false), 3000);
    } else {
      setHeaderVisible(true);
      clearTimeout(headerTimer.current);
    }
    return () => clearTimeout(headerTimer.current);
  }, [mode]);

  /* スワイプ */
  const swipeRef = useRef({ startX: 0, startY: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
    const dy = e.changedTouches[0].clientY - swipeRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) nextPage(); else prevPage();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      showHeader();
    }
  };

  /* ページ操作 */
  const nextPage = () => {
    if (currentPage < PAGES.length - 1) {
      setCurrentPage(p => p + 1);
      saveProgress(work.id, { lastEpisodeId: episode.id, lastFlipPage: currentPage + 1 });
    }
  };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(p => p - 1); };

  /* キーボード */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (mode !== "flip") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextPage();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prevPage();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* スクロール進捗 */
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const pct = scrollHeight > clientHeight ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) : 0;
    saveProgress(work.id, { lastEpisodeId: episode.id, lastScrollPct: pct });
  };

  const page = PAGES[currentPage];
  const pct  = Math.round(((currentPage + 1) / PAGES.length) * 100);
  const allEps = chapters.flatMap(c => c.episodes);

  const readerStyle = { background: themeBg, color: themeTxt };
  const fontFamily = font === "mincho" ? "'Noto Serif JP',serif" : font === "gothic" ? "'Noto Sans JP',sans-serif" : "monospace";

  return (
    <div className="fixed inset-0 overflow-hidden" style={readerStyle}>

      {/* ── ヘッダー ── */}
      <header className={cn(
        "absolute top-0 left-0 right-0 z-50 h-[50px]",
        "flex items-center justify-between px-4",
        "border-b border-white/8 backdrop-blur-nav",
        "transition-[transform,opacity] duration-300",
        headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )} style={{ background: "rgba(15,14,20,0.92)" }}>
        <div className="flex flex-col gap-0.5">
          <Link href={`/works/${work.id}`} className="text-[10px] text-text-3 flex items-center gap-1 hover:text-text-2 transition-colors">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4" /></svg>
            作品詳細
          </Link>
          <p className="text-[12px] font-medium text-text-1">{episode.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* モード切り替え */}
          <div className="flex gap-0.5 p-0.5 bg-white/5 border border-border rounded-full">
            {(["flip", "scroll"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); showHeader(); }}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full transition-all duration-200",
                  mode === m ? "bg-accent-2 text-white" : "text-text-3"
                )}
              >
                {m === "flip" ? "めくり" : "スクロール"}
              </button>
            ))}
          </div>
          {["name","display","toc"].map(btn => (
            <button key={btn} onClick={() => {
              if (btn === "toc") { setTocOpen(true); }
              else { setSettingsOpen(true); setSettingsTab(btn as "name" | "display"); }
              showHeader();
            }}
              className="w-[34px] h-[34px] rounded-full bg-white/6 border border-border flex items-center justify-center hover:bg-accent-dim hover:border-accent-lt/30 transition-all">
              {btn === "name" ? <UserSvg /> : btn === "display" ? <MenuSvg /> : <TocSvg />}
            </button>
          ))}
        </div>
      </header>

      {/* ══ Flip Mode ══ */}
      {mode === "flip" && (
        <div
          className="absolute inset-0 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={showHeader}
        >
          {/* 透明タップゾーン: 左半分→前ページ、右半分→次ページ */}
          <div className="absolute inset-0 z-10 flex pointer-events-none" style={{ top: "50px" }}>
            <div
              className="flex-1 h-full cursor-pointer pointer-events-auto"
              onClick={e => { e.stopPropagation(); prevPage(); }}
            />
            <div
              className="flex-1 h-full cursor-pointer pointer-events-auto"
              onClick={e => { e.stopPropagation(); nextPage(); }}
            />
          </div>
          {/* メディアエリア 55% */}
          <div className="w-full flex-shrink-0 relative overflow-hidden" style={{ height: "55%" }}>
            <div className="absolute inset-0 transition-all duration-700" style={{ background: page.bg }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "50px 50px",
                maskImage: "radial-gradient(ellipse 100% 80% at 50% 50%, black, transparent)",
                WebkitMaskImage: "radial-gradient(ellipse 100% 80% at 50% 50%, black, transparent)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-1/2"
              style={{ background: `linear-gradient(to bottom, transparent, ${themeBg})` }} />
          </div>

          {/* テキストエリア */}
          <div className="flex-1 px-7 pt-2.5 flex flex-col overflow-hidden">
            {/* 名前変換バッジ */}
            {work.nameChars.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setSettingsOpen(true); setSettingsTab("name"); showHeader(); }}
                className="inline-flex items-center gap-1.5 self-start mb-2 text-[10px] text-accent-lt bg-accent/20 border border-accent-lt/30 rounded-full px-2.5 py-1 flex-shrink-0"
              >
                <UserSvg size={10} /> 名前変換：有効
              </button>
            )}
            <div
              className="flex-1 overflow-hidden"
              style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}em`, color: themeTxt }}
              dangerouslySetInnerHTML={{ __html: transformText(page.text)
                .replace(/\n/g, "<br>")
                .replace(/\{\{([^}]+)_([^}]+)\}\}/g, `<span style="color:#c5b3ff">$1</span>`) }}
            />
            {/* 進捗 */}
            <div className="pt-2 pb-3 flex-shrink-0">
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-accent rounded-full transition-[width] duration-400" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: `${themeTxt}55` }}>
                <span>{currentPage + 1} / {PAGES.length} ページ</span>
                <span>{pct}%</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══ Scroll Mode ══ */}
      {mode === "scroll" && (
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto"
          style={{ paddingTop: "50px" }}
          onScroll={handleScroll}
        >
          <div className="max-w-[680px] mx-auto px-6 pb-32 pt-6">
            {/* 名前変換バー */}
            {work.nameChars.length > 0 && (
              <button
                onClick={() => { setSettingsOpen(true); setSettingsTab("name"); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg mb-6 text-left
                           bg-accent/10 border border-accent-lt/20 hover:bg-accent/15 transition-colors"
              >
                <span className="flex items-center gap-2 text-[11px] text-accent-lt">
                  <UserSvg size={12} /> 名前変換設定
                </span>
                <div className="flex gap-1.5">
                  {work.nameChars.slice(0, 2).map(c => (
                    <span key={c.id} className="text-[9.5px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-lt border border-accent-lt/20">
                      {c.displayName} → {nameMap[c.id] || "そのまま"}
                    </span>
                  ))}
                </div>
              </button>
            )}

            <h1 className="font-serif text-[clamp(18px,3.5vw,26px)] font-normal mb-7 pb-5 border-b border-white/7"
              style={{ color: themeTxt }}>
              {episode.title}
            </h1>

            {/* 本文 */}
            <div style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}em`, color: themeTxt }}>
              {PAGES.map((p, i) => (
                <div key={i}>
                  {p.hasMedia && (
                    <div className="my-7 -mx-2 rounded-xl overflow-hidden border border-white/8">
                      <div className="h-[200px] flex items-center justify-center text-4xl" style={{ background: p.bg }}>
                        🌸
                      </div>
                      </div>
                  )}
                  <div
                    className="mb-5"
                    dangerouslySetInnerHTML={{ __html: transformText(p.text)
                      .replace(/\n\n/g, "</p><p style='text-indent:1em;margin-bottom:1.4em;'>")
                      .replace(/\n/g, "<br>")
                      .replace(/\{\{([^}]+)_([^}]+)\}\}/g, `<span style="color:#c5b3ff">$1</span>`) }}
                  />
                </div>
              ))}
            </div>

            {/* 前後ナビ */}
            <div className="flex gap-3 mt-12 pt-6 border-t border-white/7">
              {prevEpisode ? (
                <Link href={`/works/${work.id}/episodes/${prevEpisode.id}?mode=scroll`}
                  className="flex-1 py-3 rounded-lg border border-border-2 bg-bg-card text-center text-[12px] text-text-2 hover:border-accent-lt/30 hover:text-accent-lt transition-all">
                  <p className="text-[10px] text-text-3 mb-0.5">← 前の話</p>
                  {prevEpisode.title}
                </Link>
              ) : <div className="flex-1" />}
              {nextEpisode && (
                <Link href={`/works/${work.id}/episodes/${nextEpisode.id}?mode=scroll`}
                  className="flex-1 py-3 rounded-lg border border-border-2 bg-bg-card text-center text-[12px] text-text-2 hover:border-accent-lt/30 hover:text-accent-lt transition-all">
                  <p className="text-[10px] text-text-3 mb-0.5">次の話 →</p>
                  {nextEpisode.title}
                </Link>
              )}
            </div>
          </div>

          {/* 読了率 */}
          <div className="fixed bottom-5 left-4 text-[11px] px-2.5 py-1 rounded-xl bg-bg-card/80 border border-border backdrop-blur-sm pointer-events-none"
            style={{ color: `${themeTxt}55` }}>
            {/* JSで動的更新 */}
          </div>
          {/* 目次ボタン */}
          <button
            onClick={() => setTocOpen(true)}
            className="fixed bottom-5 right-4 w-11 h-11 rounded-full bg-accent/75 border border-accent-lt/30 flex items-center justify-center backdrop-blur-sm hover:bg-accent transition-colors"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <TocSvg color="white" />
          </button>
        </div>
      )}

      {/* ══ 設定パネル（ボトムシート）══ */}
      {settingsOpen && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a1827] rounded-t-xl border border-white/10 animate-slide-up max-h-[80dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-8 h-0.5 bg-white/20 rounded-full mx-auto mt-2.5" />
            {/* タブ */}
            <div className="flex border-b border-white/8">
              {(["display","name","other"] as const).map((t, i) => (
                <button key={t} onClick={() => setSettingsTab(t)}
                  className={cn("flex-1 py-2.5 text-[11px] border-b-2 transition-all",
                    settingsTab === t ? "text-accent-lt border-accent" : "text-text-3 border-transparent")}>
                  {["表示設定","名前変換","その他"][i]}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 flex flex-col gap-4 pb-8">
              {settingsTab === "display" && (
                <>
                  <SettingSlider label="フォントサイズ" value={fontSize} min={12} max={24}
                    display={`${fontSize}px`} onChange={setFontSize} />
                  <SettingSlider label="行間" value={lineHeight * 10} min={15} max={25}
                    display={lineHeight.toFixed(1)} onChange={v => setLineHeight(v / 10)} />
                  {/* フォント */}
                  <div>
                    <p className="text-[11px] text-text-2 mb-2">フォント</p>
                    <div className="flex gap-1.5">
                      {(["mincho","gothic","mono"] as const).map((f, i) => (
                        <button key={f} onClick={() => setFont(f)}
                          className={cn("flex-1 py-2 rounded-lg border text-center transition-all",
                            font === f ? "bg-accent-dim border-accent-lt/35" : "bg-bg-card border-border")}>
                          <div className="text-sm mb-0.5" style={{ fontFamily: f === "mincho" ? "serif" : f === "mono" ? "monospace" : "sans-serif" }}>あ</div>
                          <div className={cn("text-[9.5px]", font === f ? "text-accent-lt" : "text-text-2")}>{["明朝体","ゴシック","等幅"][i]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 背景色 */}
                  <div>
                    <p className="text-[11px] text-text-2 mb-2">背景色</p>
                    <div className="flex gap-2">
                      {THEMES.map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id as Parameters<typeof setTheme>[0])}
                          className={cn("w-8 h-8 rounded-full border-2 transition-all", themeBg === t.bg ? "border-accent-lt" : "border-transparent")}
                          style={{ background: t.bg, boxShadow: t.id === "white" ? "0 0 0 0.5px rgba(0,0,0,0.2)" : "none" }} />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {settingsTab === "name" && (
                <div className="flex flex-col gap-3">
                  {work.nameChars.map(c => (
                    <div key={c.id} className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-accent/30 text-accent-lt text-[9px] font-medium flex items-center justify-center flex-shrink-0">
                        {c.displayName.charAt(0)}
                      </span>
                      <span className="text-[11px] text-text-2 min-w-[40px]">{c.displayName}</span>
                      <span className="text-text-3">→</span>
                      <input
                        value={nameMap[c.id] ?? ""}
                        onChange={e => setName(work.id, c.id, e.target.value)}
                        placeholder="空欄 = 変換しない"
                        className={cn(
                          "flex-1 bg-white/5 border rounded-md px-2.5 py-1.5 text-[11px] text-text-1",
                          "placeholder:text-text-3 outline-none caret-accent-lt",
                          nameMap[c.id] ? "border-accent-lt/35 bg-accent/10" : "border-white/12"
                        )}
                      />
                    </div>
                  ))}
                  <button onClick={() => resetNames(work.id)} className="text-[10px] text-text-3 text-right hover:text-text-2 transition-colors">
                    すべてリセット
                  </button>
                </div>
              )}
              {settingsTab === "other" && (
                <div className="flex flex-col gap-2">
                  <OtherRow label="読書モードを切り替え" value={mode === "flip" ? "縦スクロールへ" : "ページめくりへ"}
                    onClick={() => { setMode(m => m === "flip" ? "scroll" : "flip"); setSettingsOpen(false); }} />
                  <OtherRow label="このページをブックマーク" value="🔖" onClick={() => alert("ブックマークを追加")} />
                  <OtherRow label="シェア" value="↗" onClick={() => navigator.share?.({ title: episode.title, url: location.href })} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ 目次ドロワー ══ */}
      {tocOpen && (
        <div className="absolute inset-0 z-[300] flex">
          <div className="flex-1" onClick={() => setTocOpen(false)}
            style={{ background: "rgba(0,0,0,0.5)" }} />
          <div className="w-[min(320px,90vw)] bg-[#1a1827] border-l border-white/10 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/8 sticky top-0 bg-[#1a1827]">
              <span className="text-[13px] font-medium text-text-1">目次</span>
              <button onClick={() => setTocOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-border flex items-center justify-center">
                <CloseSvg />
              </button>
            </div>
            {chapters.map(ch => (
              <div key={ch.id}>
                <p className="text-[9.5px] text-accent-lt/60 px-4 pt-3 pb-1 uppercase tracking-wider">{ch.title}</p>
                {ch.episodes.map(ep => (
                  <Link key={ep.id} href={`/works/${work.id}/episodes/${ep.id}?mode=${mode}`}
                    onClick={() => setTocOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 border-b border-white/4 transition-all",
                      ep.id === episode.id ? "bg-accent-dim" : "hover:bg-white/3"
                    )}>
                    <span className="text-[10px] text-text-3 min-w-[16px]">{ep.sortOrder + 1}</span>
                    <span className={cn("text-[12px] flex-1", ep.id === episode.id ? "text-accent-lt" : "text-text-2")}>{ep.title}</span>
                    <span className={cn("w-1.5 h-1.5 rounded-full", ep.id === episode.id ? "bg-accent" : "bg-white/10")} />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ヘルパーコンポーネント ── */
function SettingSlider({ label, value, min, max, display, onChange }: {
  label: string; value: number; min: number; max: number; display: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-2">
        <span className="text-text-2">{label}</span>
        <span className="text-accent-lt font-medium">{display}</span>
      </div>
      <div className="relative h-1 bg-white/10 rounded-full">
        <div className="absolute left-0 top-0 h-full bg-accent rounded-full pointer-events-none" style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} value={value} step={1}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5" />
      </div>
      <div className="flex justify-between text-[10px] text-text-3 mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function OtherRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-between px-3.5 py-3 bg-bg-card rounded-lg border border-border hover:border-border-2 transition-colors w-full">
      <span className="text-[12px] text-text-2">{label}</span>
      <span className="text-[11px] text-accent-lt">{value}</span>
    </button>
  );
}

const THEMES = [
  { id: "dark",  bg: "#0f0e14" }, { id: "sepia", bg: "#1e1812" },
  { id: "navy",  bg: "#0e1422" }, { id: "warm",  bg: "#1e1414" },
  { id: "cream", bg: "#f5f0e8" }, { id: "white", bg: "#ffffff" },
];

/* ── SVG アイコン ── */
const UserSvg = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7">
    <circle cx="8" cy="5" r="3" /><path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
  </svg>
);
const MenuSvg = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7">
    <path d="M3 4h10M3 8h10M3 12h6" />
  </svg>
);
const TocSvg = ({ color = "rgba(255,255,255,0.6)" }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7">
    <path d="M3 4h2M7 4h6M3 8h2M7 8h6M3 12h2M7 12h4" />
  </svg>
);
const CloseSvg = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);
