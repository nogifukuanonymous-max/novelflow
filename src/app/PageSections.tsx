"use client";
import Link from "next/link";
import { useRef } from "react";
import { NovelCard, RankCard } from "@/components/works/WorkCard";
import { MOCK_WORKS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════
   PickupSection
══════════════════════════════════════ */
export function PickupSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-14">
      <div className="flex items-end justify-between px-8 max-w-[1100px] mx-auto mb-6">
        <div>
          <p className="text-[10px] text-accent tracking-widest uppercase mb-1">PICKUP</p>
          <h2 className="font-serif text-[clamp(22px,3vw,32px)] font-normal text-text-1">今週の注目作品</h2>
        </div>
        <Link href="/search" className="text-[12px] text-accent flex items-center gap-1 hover:text-accent-lt transition-colors">
          すべて見る <span>→</span>
        </Link>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 px-8 overflow-x-auto scrollbar-none"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {MOCK_WORKS.concat(MOCK_WORKS).map((w, i) => (
          <NovelCard key={`${w.id}-${i}`} work={w} />
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   RankingSection
══════════════════════════════════════ */
const RANK_PERIODS = ["週間", "日間", "月間", "累計"] as const;
type Period = (typeof RANK_PERIODS)[number];

export function RankingSection() {
  const sorted = [...MOCK_WORKS].sort((a, b) => b.likeCount - a.likeCount);

  return (
    <section className="py-14 max-w-[1100px] mx-auto px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* ランキング */}
        <div>
          <p className="text-[10px] text-accent tracking-widest uppercase mb-1">RANKING</p>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-[clamp(22px,3vw,32px)] font-normal text-text-1">週間ランキング</h2>
            <div className="flex gap-1">
              {RANK_PERIODS.map((p, i) => (
                <button
                  key={p}
                  className={cn(
                    "text-[11px] px-3.5 py-1.5 rounded-2xl border transition-all duration-200",
                    i === 0
                      ? "bg-accent-dim border-accent-lt/30 text-accent-lt"
                      : "bg-transparent border-border text-text-3 hover:text-text-2"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {sorted.map((w, i) => (
              <RankCard key={w.id} work={w} rank={i + 1} />
            ))}
          </div>
        </div>

        {/* ジャンル */}
        <div>
          <p className="text-[10px] text-accent tracking-widest uppercase mb-1">GENRE</p>
          <h2 className="font-serif text-[clamp(22px,3vw,32px)] font-normal text-text-1 mb-5">ジャンルから探す</h2>
          <div className="grid grid-cols-2 gap-2">
            {GENRES.map(g => (
              <Link
                key={g.value}
                href={`/search?genre=${g.value}`}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-4 px-2",
                  "bg-bg-card border border-border rounded-sm",
                  "cursor-pointer transition-all duration-200",
                  "hover:border-accent-lt/20 hover:bg-bg-card2 hover:-translate-y-0.5"
                )}
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-[11px] text-text-2">{g.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const GENRES = [
  { value: "romance",    label: "恋愛",     emoji: "💜" },
  { value: "sf",         label: "SF",       emoji: "🌌" },
  { value: "fantasy",    label: "ファンタジー", emoji: "🗡️" },
  { value: "horror",     label: "ホラー",    emoji: "👻" },
  { value: "mystery",    label: "ミステリー", emoji: "🔍" },
  { value: "comedy",     label: "コメディ",  emoji: "😂" },
  { value: "historical", label: "歴史・時代", emoji: "📖" },
  { value: "other",      label: "その他",   emoji: "✨" },
];

/* ══════════════════════════════════════
   NvfBanner
══════════════════════════════════════ */
export function NvfBanner() {
  return (
    <div className="px-8 max-w-[1100px] mx-auto mb-16">
      <div
        className={cn(
          "flex items-center gap-6 p-7 rounded-xl",
          "border border-accent-lt/18 cursor-pointer",
          "transition-all duration-200",
          "hover:border-accent-lt/35",
          "relative overflow-hidden"
        )}
        style={{
          background: "linear-gradient(135deg, rgba(83,74,183,0.15) 0%, rgba(29,158,117,0.08) 100%)",
        }}
      >
        {/* 背景装飾 */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(122,93,199,0.12), transparent 70%)" }} />

        {/* アイコン */}
        <div className="w-14 h-14 rounded-[14px] bg-accent/25 border border-accent-lt/20
                        flex items-center justify-center flex-shrink-0 text-2xl relative z-10">
          📦
        </div>

        {/* テキスト */}
        <div className="flex-1 relative z-10">
          <p className="text-[15px] font-medium text-accent-lt mb-1.5">
            アプリで .nvf / .nvp ファイルを楽しむ
          </p>
          <p className="text-[12px] text-text-2 leading-[1.7] mb-3">
            作者から受け取ったファイルをアプリでそのまま開ける。容量無制限・動画対応。<br />
            好きな「ビジュアルパック」を選んで、同じ物語を違う雰囲気で読み直せます。
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {["容量無制限", "動画対応", "オフライン読書", "メディアパック切替"].map(t => (
              <span key={t}
                className="text-[10px] px-2.5 py-1 rounded-full bg-accent/15 text-accent-lt border border-accent-lt/20">
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xl text-accent-lt/40 flex-shrink-0 relative z-10">›</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FeatureSection
══════════════════════════════════════ */
export function FeatureSection() {
  return (
    <section className="py-14 max-w-[1100px] mx-auto px-8">
      <div className="text-center mb-12">
        <p className="text-[10px] text-accent tracking-widest uppercase mb-2">FEATURES</p>
        <h2 className="font-serif text-[clamp(26px,3.5vw,38px)] font-normal text-text-1">
          NovelFlowが選ばれる3つの理由
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={cn(
              "bg-bg-card border border-border rounded-xl p-7 relative overflow-hidden",
              "transition-all duration-200 hover:border-accent-lt/20 hover:-translate-y-0.5"
            )}
          >
            {/* 上部アクセントライン */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />

            <p className="font-serif text-[38px] font-normal mb-4 leading-none"
              style={{ color: `${f.accent}33` }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl"
              style={{ background: `${f.accent}22`, border: `0.5px solid ${f.accent}33` }}>
              {f.icon}
            </div>
            <h3 className="text-[16px] font-medium text-text-1 mb-2.5">{f.title}</h3>
            <p className="text-[12.5px] text-text-2 leading-[1.8]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: "👤", accent: "#7a5dc7",
    title: "名前変換機能",
    desc: "登場人物の名前をあなたの名前に置き換えて読める唯一の機能。よみがな・語尾変化にも対応。設定はブラウザに保存され、サーバーには一切送信されません。",
  },
  {
    icon: "📖", accent: "#1d9e75",
    title: "2つの読書モード",
    desc: "本のページをめくる没入感のある「Flipモード」と、快適に流し読みできる「Scrollモード」。作者が最適なモードを指定することも可能です。",
  },
  {
    icon: "📦", accent: "#d85a30",
    title: "メディアパック配布",
    desc: "作者がキャラクターの画像・動画を「パック」として配布。読者は好みのパックをインポートして、同じ物語を異なるビジュアルで楽しめます。",
  },
];

/* ══════════════════════════════════════
   CtaSection
══════════════════════════════════════ */
export function CtaSection() {
  return (
    <section className="py-28 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(83,74,183,0.15), transparent)" }} />
      <h2 className="font-serif text-[clamp(32px,5vw,54px)] font-normal leading-[1.25] mb-5 relative z-10">
        あなたの物語を、<br />
        <em className="not-italic text-accent-lt">今すぐ始めよう</em>
      </h2>
      <p className="text-[14px] text-text-2 max-w-[460px] mx-auto mb-9 leading-[1.9] relative z-10">
        読者として好きな物語に没入するも、<br />
        作者として自分の世界を届けるも、あなた次第。
      </p>
      <div className="flex gap-3 justify-center flex-wrap relative z-10">
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                     bg-accent-2 text-white text-[14px] hover:bg-accent hover:-translate-y-px transition-all"
          style={{ boxShadow: "0 4px 24px rgba(83,74,183,0.4)" }}
        >
          無料で始める
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                     bg-transparent text-text-2 text-[14px]
                     border border-border-2
                     hover:border-accent hover:text-accent-lt hover:bg-accent-dim transition-all"
        >
          まず作品を見る
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   FooterSection
══════════════════════════════════════ */
export function FooterSection() {
  return (
    <footer className="border-t border-border px-8 py-8 flex items-center justify-between flex-wrap gap-4">
      <span className="font-serif text-[15px] text-accent">NovelFlow</span>
      <nav className="flex gap-5">
        {["利用規約", "プライバシーポリシー", "お問い合わせ", "運営会社"].map(l => (
          <Link key={l} href="#" className="text-[11px] text-text-3 hover:text-text-2 transition-colors">{l}</Link>
        ))}
      </nav>
      <span className="text-[10px] text-text-3">© 2025 NovelFlow</span>
    </footer>
  );
}
