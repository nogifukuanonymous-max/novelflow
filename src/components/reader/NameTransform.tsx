"use client";
import { useState } from "react";
import { useNameStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { NameChar } from "@/types";

/* ══════════════════════════════════════
   名前変換パネル（作品詳細ページ用）
══════════════════════════════════════ */
interface NamePanelProps {
  workId: string;
  nameChars: NameChar[];
  onApply?: () => void;   // 「設定して読む」コールバック
  className?: string;
}

export function NamePanel({ workId, nameChars, onApply, className }: NamePanelProps) {
  const { getNameMap, setName, resetNames } = useNameStore();
  const nameMap = getNameMap(workId);
  const [isOpen, setIsOpen] = useState(true);

  if (nameChars.length === 0) return null;

  return (
    <div className={cn(
      "rounded-md overflow-hidden border",
      "bg-accent/9 border-accent-lt/20",
      className
    )}>
      {/* ヘッダー */}
      <button
        className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-accent-lt/12"
        onClick={() => setIsOpen(o => !o)}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium text-accent-lt">
          <UserIcon />
          名前変換設定
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/25 text-accent-lt">
            {nameChars.length}キャラ
          </span>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      {/* ボディ */}
      {isOpen && (
        <>
          <div className="px-3.5 py-3 flex flex-col gap-2.5">
            {nameChars.map(char => (
              <NameRow
                key={char.id}
                char={char}
                value={nameMap[char.id] ?? ""}
                onChange={v => setName(workId, char.id, v)}
              />
            ))}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-3.5 py-2 border-t border-accent-lt/10">
            <button
              onClick={() => resetNames(workId)}
              className="text-[11px] text-text-3 hover:text-text-2 transition-colors"
            >
              リセット
            </button>
            {onApply && (
              <button
                onClick={onApply}
                className="text-[11px] px-4 py-1.5 rounded-xl bg-accent-2 text-white hover:bg-accent transition-colors"
              >
                設定して読む →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── 1キャラ分の行 ── */
interface NameRowProps {
  char: NameChar;
  value: string;
  onChange: (v: string) => void;
}
function NameRow({ char, value, onChange }: NameRowProps) {
  const initials = char.displayName.charAt(0);
  return (
    <div className="flex items-center gap-2.5">
      {/* アバター */}
      <span className="w-7 h-7 rounded-full bg-accent/30 text-accent-lt text-[10px] font-medium flex items-center justify-center flex-shrink-0">
        {initials}
      </span>
      {/* 元の名前 */}
      <span className="text-[11px] text-text-2 min-w-[40px]">{char.displayName}</span>
      <span className="text-text-3 text-sm">→</span>
      {/* 入力 */}
      <div className="flex-1 flex flex-col gap-0.5">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="空欄 = 変換しない"
          maxLength={20}
          className={cn(
            "w-full bg-white/5 border rounded-md px-2.5 py-1.5 text-[11px] text-text-1",
            "placeholder:text-text-3 outline-none caret-accent-lt transition-colors",
            value
              ? "border-accent-lt/35 bg-accent/10"
              : "border-white/12 focus:border-accent-lt/30"
          )}
        />
        {value && (
          <span className="text-[10px] text-accent-lt/50">よみ：{value}</span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   名前変換バー（読書中・設定パネル用）
══════════════════════════════════════ */
interface NameBarProps {
  workId: string;
  nameChars: NameChar[];
  compact?: boolean;
  className?: string;
}
export function NameBar({ workId, nameChars, compact = false, className }: NameBarProps) {
  const { getNameMap } = useNameStore();
  const nameMap = getNameMap(workId);
  const activeCount = Object.values(nameMap).filter(Boolean).length;

  return (
    <div className={cn(
      "flex items-center gap-2",
      "bg-accent/10 border border-accent-lt/20 rounded-lg",
      compact ? "px-2.5 py-1.5" : "px-3 py-2",
      className
    )}>
      <UserIcon className="text-accent-lt w-3 h-3 flex-shrink-0" />
      <span className={cn("text-accent-lt", compact ? "text-[10px]" : "text-[11px]")}>
        名前変換
        {activeCount > 0 ? "：有効" : "：未設定"}
      </span>
      {activeCount > 0 && nameChars.slice(0, 2).map(c => (
        <span
          key={c.id}
          className="text-[9px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-lt border border-accent-lt/20"
        >
          {c.displayName} → {nameMap[c.id] || c.displayName}
        </span>
      ))}
    </div>
  );
}

/* ── アイコン ── */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-3 h-3", className)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="5" r="3" />
      <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-3.5 h-3.5 text-text-3 transition-transform duration-200", open && "rotate-180")}
      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
