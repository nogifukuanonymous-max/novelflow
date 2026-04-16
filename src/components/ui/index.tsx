"use client";
import { cn, getGenreInfo, getStatusInfo, getWorkGradient } from "@/lib/utils";
import type { Genre, SerialStatus, ReadingMode } from "@/types";

/* ══════════════════════════════════════
   Badge
══════════════════════════════════════ */
interface BadgeProps {
  variant?: "purple" | "teal" | "coral" | "gray" | "amber" | "blue";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}
export function Badge({ variant = "gray", size = "sm", children, className }: BadgeProps) {
  const variantCls = {
    purple: "bg-accent/20 border-accent-lt/25 text-accent-lt",
    teal:   "bg-teal/15 border-teal/25 text-[#5dcaa5]",
    coral:  "bg-coral/12 border-coral/22 text-[#f0997b]",
    gray:   "bg-white/7 border-border text-text-2",
    amber:  "bg-amber/12 border-amber/22 text-amber",
    blue:   "bg-blue/12 border-blue/22 text-[#85b7eb]",
  }[variant];
  const sizeCls = size === "sm"
    ? "text-[10px] px-2.5 py-0.5"
    : "text-xs px-3 py-1";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border",
      variantCls, sizeCls, className
    )}>
      {children}
    </span>
  );
}

/* ── ジャンルバッジ ── */
export function GenreBadge({ genre, showEmoji = false }: { genre: Genre; showEmoji?: boolean }) {
  const info = getGenreInfo(genre);
  return (
    <Badge className={info.color}>
      {showEmoji && <span>{info.emoji}</span>}
      {info.label}
    </Badge>
  );
}

/* ── 連載状態バッジ ── */
export function StatusBadge({ status }: { status: SerialStatus }) {
  const info = getStatusInfo(status);
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-md", info.color)}>
      {info.label}
    </span>
  );
}

/* ── 読書モードバッジ ── */
const MODE_BADGE_MAP: Record<ReadingMode, { label: string; cls: string }> = {
  both:        { label: "両モード対応", cls: "bg-accent/15 text-accent-lt border-accent-lt/2" },
  flip_only:   { label: "めくりのみ",   cls: "bg-white/7 text-text-2 border-border" },
  scroll_only: { label: "スクロールのみ", cls: "bg-white/7 text-text-2 border-border" },
};
export function ReadingModeBadge({ mode }: { mode: ReadingMode }) {
  const info = MODE_BADGE_MAP[mode];
  return (
    <span className={cn("text-[9.5px] px-2 py-0.5 rounded-md border", info.cls)}>
      {info.label}
    </span>
  );
}

/* ══════════════════════════════════════
   Button
══════════════════════════════════════ */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
}
export function Button({
  variant = "primary", size = "md", className, children, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantCls = {
    primary: "bg-accent-2 text-white rounded-full font-normal border-none hover:bg-accent hover:-translate-y-px",
    ghost:   "bg-transparent text-text-2 rounded-full border border-border-2 hover:border-accent hover:text-accent-lt hover:bg-accent-dim",
    icon:    "bg-white/5 text-text-2 rounded-full border border-border hover:bg-accent-dim hover:border-accent-lt/30",
  }[variant];
  const sizeCls = {
    sm: variant === "icon" ? "w-8 h-8" : "text-xs px-4 py-2",
    md: variant === "icon" ? "w-9 h-9" : "text-sm px-5 py-2.5",
    lg: variant === "icon" ? "w-11 h-11" : "text-base px-6 py-3",
  }[size];
  return (
    <button className={cn(base, variantCls, sizeCls, className)} {...props}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════
   WorkCover（サムネイル or グラデーション）
══════════════════════════════════════ */
interface WorkCoverProps {
  workId: string;
  thumbnailUrl?: string | null;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
}
export function WorkCover({
  workId, thumbnailUrl, title, className, children,
}: WorkCoverProps) {
  const grad = getWorkGradient(workId);
  return (
    <div
      className={cn("relative overflow-hidden rounded", className)}
      style={thumbnailUrl ? {} : { background: grad }}
    >
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt={title ?? ""}
          className="w-full h-full object-cover"
        />
      )}
      {children}
    </div>
  );
}

/* ══════════════════════════════════════
   ProgressBar
══════════════════════════════════════ */
interface ProgressBarProps {
  value: number;   // 0-100
  className?: string;
  fillClassName?: string;
}
export function ProgressBar({ value, className, fillClassName }: ProgressBarProps) {
  return (
    <div className={cn("h-0.5 bg-white/10 rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-accent-2 to-accent transition-[width] duration-500 ease-out",
          fillClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ══════════════════════════════════════
   ToggleSwitch
══════════════════════════════════════ */
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}
export function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0",
        checked ? "bg-accent-2" : "bg-white/10",
        className
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-[14px] h-[14px] rounded-full bg-white transition-[left,right] duration-200",
        checked ? "right-0.5 left-auto" : "left-0.5"
      )} />
    </button>
  );
}

/* ══════════════════════════════════════
   RadioCard
══════════════════════════════════════ */
interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}
export function RadioCard({ selected, onClick, label, className }: RadioCardProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer border transition-all duration-200",
        selected
          ? "bg-accent/12 border-accent-lt/22 text-accent-lt"
          : "border-transparent text-text-2 hover:bg-white/3",
        className
      )}
    >
      {/* ラジオドット */}
      <span className={cn(
        "w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors",
        selected ? "border-accent" : "border-white/20"
      )}>
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-accent-lt" />}
      </span>
      <span className="text-[11px]">{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   Divider
══════════════════════════════════════ */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border", className)} />;
}

/* ══════════════════════════════════════
   SectionLabel
══════════════════════════════════════ */
interface SectionLabelProps {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}
export function SectionLabel({ eyebrow, title, action, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-end justify-between mb-4", className)}>
      <div>
        {eyebrow && <p className="text-[10px] text-accent tracking-widest uppercase mb-1">{eyebrow}</p>}
        <h2 className="font-serif text-2xl font-normal text-text-1 leading-snug">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ══════════════════════════════════════
   EmptyState
══════════════════════════════════════ */
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 px-5 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-base text-text-2 mb-2">{title}</p>
      {description && <p className="text-xs text-text-3 leading-relaxed mb-4">{description}</p>}
      {action}
    </div>
  );
}
