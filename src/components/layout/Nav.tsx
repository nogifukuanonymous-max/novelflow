"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════
   GlobalNav（全ページ共通トップナビ）
══════════════════════════════════════ */
interface GlobalNavProps {
  transparent?: boolean;  // ヒーロー上部など背景を透明にするケース
  className?: string;
}

export function GlobalNav({ transparent = false, className }: GlobalNavProps) {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "flex items-center justify-between",
      "px-7 h-[52px]",
      "border-b border-border",
      "backdrop-blur-nav",
      transparent ? "bg-transparent border-transparent" : "bg-nav",
      className
    )}>
      {/* ロゴ */}
      <Link
        href="/"
        className="font-serif text-[18px] text-accent-lt tracking-wide hover:opacity-80 transition-opacity"
      >
        Novel<span className="text-accent">Flow</span>
      </Link>

      {/* センターリンク（デスクトップのみ） */}
      <nav className="hidden md:flex items-center gap-7">
        <Link href="/search"  className="text-[13px] text-text-2 hover:text-text-1 transition-colors">探す</Link>
        <Link href="/ranking" className="text-[13px] text-text-2 hover:text-text-1 transition-colors">ランキング</Link>
        <Link href="/editor"  className="text-[13px] text-text-2 hover:text-text-1 transition-colors">書く</Link>
      </nav>

      {/* 右側アクション */}
      <div className="flex items-center gap-2.5">
        {/* 検索アイコン（モバイル） */}
        <Link
          href="/search"
          className="flex md:hidden w-9 h-9 rounded-full bg-white/5 border border-border items-center justify-center hover:bg-accent-dim hover:border-accent-lt/30 transition-all"
          aria-label="検索"
        >
          <SearchIcon />
        </Link>

        {/* ログインボタン */}
        <Link
          href="/auth/login"
          className="hidden md:inline-flex text-[13px] px-4 py-1.5 rounded-full bg-transparent border border-border-2 text-text-2 hover:border-accent hover:text-accent-lt hover:bg-accent-dim transition-all"
        >
          ログイン
        </Link>

        {/* 新規登録ボタン */}
        <Link
          href="/auth/register"
          className="hidden md:inline-flex text-[13px] px-4 py-1.5 rounded-full bg-accent-2 text-white border-none hover:bg-accent hover:-translate-y-px transition-all"
          style={{ boxShadow: "0 2px 10px rgba(83,74,183,0.3)" }}
        >
          新規登録
        </Link>

        {/* アバター（ログイン後） */}
        <AvatarButton />
      </div>
    </header>
  );
}

/* ── 検索アイコン ── */
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8">
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M11 11l3 3" />
    </svg>
  );
}

/* ── アバターボタン（auth連携前のダミー） ── */
function AvatarButton() {
  // TODO: useAuthStoreと連携
  return null;
}

/* ══════════════════════════════════════
   BottomTabBar（モバイル用）
══════════════════════════════════════ */
interface BottomTabBarProps {
  active: "home" | "explore" | "write" | "library" | "mypage";
}

const TABS = [
  { id: "home",    href: "/",        label: "ホーム",   icon: HomeIcon },
  { id: "explore", href: "/search",  label: "探す",     icon: ExploreIcon },
  { id: "write",   href: "/editor",  label: "書く",     icon: WriteIcon },
  { id: "library", href: "/library", label: "ライブラリ", icon: LibraryIcon },
  { id: "mypage",  href: "/mypage",  label: "マイページ", icon: MypageIcon },
] as const;

export function BottomTabBar({ active }: BottomTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex bg-bg/95 border-t border-border backdrop-blur-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", height: "56px" }}
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 pt-0.5",
              "text-[9.5px] transition-colors duration-200",
              isActive ? "text-accent-lt" : "text-text-3"
            )}
          >
            <Icon active={isActive} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── タブアイコン ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke={active ? "#c5b3ff" : "rgba(255,255,255,0.28)"} strokeWidth="1.7">
      <path d="M3 9.5L10 3l7 6.5V17H13v-4H7v4H3V9.5z" />
    </svg>
  );
}
function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke={active ? "#c5b3ff" : "rgba(255,255,255,0.28)"} strokeWidth="1.7">
      <circle cx="9" cy="9" r="6" />
      <path d="M15 15l3.5 3.5" />
    </svg>
  );
}
function WriteIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke={active ? "#c5b3ff" : "rgba(255,255,255,0.28)"} strokeWidth="1.7">
      <path d="M4 16l3-1 8-8-2-2-8 8-1 3z" />
      <path d="M14 5l2 2" />
    </svg>
  );
}
function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke={active ? "#c5b3ff" : "rgba(255,255,255,0.28)"} strokeWidth="1.7">
      <path d="M4 3h3v14H4zM9 3h3v14H9zM14 3l3 1v12l-3 1V3z" />
    </svg>
  );
}
function MypageIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke={active ? "#c5b3ff" : "rgba(255,255,255,0.28)"} strokeWidth="1.7">
      <circle cx="10" cy="7" r="4" />
      <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

/* ══════════════════════════════════════
   BackNav（前ページへ戻るナビ）
══════════════════════════════════════ */
interface BackNavProps {
  href: string;
  label: string;
  rightContent?: React.ReactNode;
  className?: string;
}
export function BackNav({ href, label, rightContent, className }: BackNavProps) {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "flex items-center justify-between",
      "px-4 h-[52px]",
      "bg-nav border-b border-border backdrop-blur-nav",
      className
    )}>
      <div className="flex items-center gap-3">
        <Link
          href={href}
          className="flex items-center gap-1.5 text-[11px] text-text-3 px-2 py-1 rounded-md bg-white/3 border border-border hover:text-text-2 hover:border-border-2 transition-all"
        >
          <ChevronLeft />
          {label}
        </Link>
      </div>
      {rightContent}
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}
