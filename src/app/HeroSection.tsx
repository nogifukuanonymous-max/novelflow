"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const dotsRef = useRef<HTMLDivElement>(null);

  /* スクロールで星ドットをパララックス */
  useEffect(() => {
    const handler = () => {
      if (!dotsRef.current) return;
      dotsRef.current.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <section className="relative min-h-dvh flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">

      {/* 背景メッシュ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[700px] h-[700px] rounded-full left-1/2 -translate-x-1/2 -top-48"
          style={{ background: "radial-gradient(circle, rgba(122,93,199,0.18) 0%, transparent 70%)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full right-[10%] bottom-0"
          style={{ background: "radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)" }} />
        {/* 星ドット */}
        <div ref={dotsRef} className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px, 40px 40px",
            backgroundPosition: "0 0, 20px 20px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
          }}
        />
      </div>

      {/* アイキャッチ */}
      <div className="relative z-10 animate-[fadeUp_0.8s_ease_both]
                      inline-flex items-center gap-2 text-[11px] text-accent-lt
                      bg-accent/12 border border-accent-lt/25 rounded-full
                      px-3.5 py-1.5 mb-7 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-lt animate-blink" />
        名前変換 × 2つの読書体験
      </div>

      {/* タイトル */}
      <h1 className="relative z-10 font-serif font-normal leading-[1.15] mb-6
                     text-[clamp(42px,7vw,88px)]
                     animate-[fadeUp_0.8s_ease_0.15s_both]">
        あなただけの<br />
        <em className="not-italic text-accent-lt">物語</em>を、読もう
      </h1>

      {/* サブテキスト */}
      <p className="relative z-10 text-[15px] text-text-2 max-w-[520px] leading-[1.9] mb-9
                    animate-[fadeUp_0.8s_ease_0.3s_both]">
        登場人物をあなたの名前に変えて没入できる、新しい小説プラットフォーム。<br />
        ページをめくる感覚と、縦スクロールの快適さ——どちらも。
      </p>

      {/* CTA */}
      <div className="relative z-10 flex gap-3 justify-center flex-wrap
                      animate-[fadeUp_0.8s_ease_0.45s_both]">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                     bg-accent-2 text-white text-[14px] border-none
                     transition-all duration-200 hover:bg-accent hover:-translate-y-px active:scale-95"
          style={{ boxShadow: "0 4px 24px rgba(83,74,183,0.4)" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v12M2 8l6 6 6-6" />
          </svg>
          作品を探す
        </Link>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                     bg-transparent text-text-2 text-[14px]
                     border border-border-2
                     transition-all duration-200
                     hover:border-accent hover:text-accent-lt hover:bg-accent-dim active:scale-95"
        >
          投稿してみる →
        </Link>
      </div>

      {/* 機能ピル */}
      <div className="relative z-10 flex gap-2 justify-center flex-wrap mt-12
                      animate-[fadeUp_0.8s_ease_0.6s_both]">
        {PILLS.map(p => (
          <span key={p.label} className={`inline-flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded-full border ${p.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dot }} />
            {p.label}
          </span>
        ))}
      </div>

      {/* スクロール誘導 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                      flex flex-col items-center gap-1.5
                      text-[10px] text-text-3 tracking-widest
                      animate-[fadeUp_0.8s_ease_1s_both]">
        <span>SCROLL</span>
        <div className="w-px h-10 bg-gradient-to-b from-accent to-transparent animate-scroll-line" />
      </div>
    </section>
  );
}

const PILLS = [
  { label: "名前変換機能",    cls: "bg-accent/15 border-accent-lt/20 text-accent-lt",  dot: "#c5b3ff" },
  { label: "ページめくり型",  cls: "bg-teal/12 border-teal/20 text-[#5dcaa5]",         dot: "#5dcaa5" },
  { label: "縦スクロール型",  cls: "bg-coral/12 border-coral/20 text-[#f0997b]",       dot: "#f0997b" },
  { label: ".nvfファイル配布", cls: "bg-blue/12 border-blue/20 text-[#85b7eb]",         dot: "#85b7eb" },
];
