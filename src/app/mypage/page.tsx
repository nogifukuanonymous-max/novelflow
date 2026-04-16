"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlobalNav, BottomTabBar } from "@/components/layout/Nav";
import { StatusBadge, ReadingModeBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { fetchNotifications, markNotifRead, markAllNotifRead } from "@/lib/supabase/queries";
import { useAuthStore } from "@/lib/store";
import { MOCK_WORKS, MOCK_NOTIFICATIONS, MOCK_ME } from "@/lib/mock-data";
import { formatCount, formatRelativeTime, getNotifText, getWorkGradient, cn } from "@/lib/utils";
import type { Notification } from "@/types";

type MyTab = "works" | "notifications" | "following";

export default function MypagePage() {
  const router  = useRouter();
  const { user, logout } = useAuthStore();
  const profile = user ?? MOCK_ME; // ログイン前はモック

  const [tab, setTab]         = useState<MyTab>("works");
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [unread, setUnread]   = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* 通知取得 */
  useEffect(() => {
    fetchNotifications()
      .then(data => {
        const list = data.length > 0 ? data : MOCK_NOTIFICATIONS;
        setNotifs(list);
        setUnread(list.filter(n => !n.isRead).length);
      })
      .catch(() => {
        setNotifs(MOCK_NOTIFICATIONS);
        setUnread(MOCK_NOTIFICATIONS.filter(n => !n.isRead).length);
      });
  }, []);

  const handleMarkRead = (id: string) => {
    markNotifRead(id).catch(() => {});
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(c => Math.max(0, c - 1));
  };

  const handleMarkAll = () => {
    markAllNotifRead().catch(() => {});
    setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-bg">
      <GlobalNav />

      {/* プロフィールヘッダー */}
      <div className="pt-[52px]">
        <ProfileHero
          profile={profile}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>

      {/* ページ内タブ */}
      <div className="sticky top-[52px] z-40 flex border-b border-border backdrop-blur-nav"
        style={{ background: "rgba(10,9,16,0.95)" }}>
        {(["works","notifications","following"] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-[12px] border-b-2 transition-all duration-200 relative",
              tab === t ? "text-accent-lt border-b-accent" : "text-text-3 border-b-transparent hover:text-text-2"
            )}
          >
            {["投稿作品","通知","フォロー中"][i]}
            {t === "notifications" && unread > 0 && (
              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-coral text-white">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pb-24">
        {tab === "works"         && <WorksTab />}
        {tab === "notifications" && (
          <NotificationsTab
            notifs={notifs}
            onMarkRead={handleMarkRead}
            onMarkAll={handleMarkAll}
          />
        )}
        {tab === "following"     && <FollowingTab />}
      </div>

      <BottomTabBar active="mypage" />

      {/* 設定ドロワー */}
      {settingsOpen && (
        <SettingsDrawer
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   プロフィールヘッダー
══════════════════════════════════════ */
function ProfileHero({ profile, onSettingsClick }: {
  profile: typeof MOCK_ME;
  onSettingsClick: () => void;
}) {
  const initial = profile.displayName.charAt(0);
  return (
    <div className="px-4 pt-5 pb-4 relative overflow-hidden border-b border-border"
      style={{ background: "linear-gradient(160deg, rgba(83,74,183,0.10) 0%, transparent 60%)" }}>
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(122,93,199,0.08), transparent 70%)" }} />

      <div className="flex gap-3.5 items-start mb-4 relative z-10">
        {/* アバター */}
        <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-[18px] font-medium text-white border-2 border-accent-lt/25"
          style={{ background: "linear-gradient(135deg,#534ab7,#7a5dc7)", boxShadow: "0 4px 16px rgba(83,74,183,0.3)" }}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-medium text-text-1">{profile.displayName}</p>
          <p className="text-[11px] text-text-3 mt-0.5">@{profile.username}</p>
          {profile.bio && (
            <p className="text-[12px] text-text-2 leading-[1.7] mt-1.5">{profile.bio}</p>
          )}
        </div>

        <button
          onClick={onSettingsClick}
          className="text-[11px] px-3 py-1.5 rounded-xl border border-border-2 text-text-2 hover:border-accent-lt/35 hover:text-accent-lt transition-all flex-shrink-0"
        >
          編集
        </button>
      </div>

      {/* 統計 */}
      <div className="flex gap-0 border-t border-border pt-3.5 relative z-10">
        {[
          { val: profile.workCount,       label: "作品" },
          { val: profile.followerCount,   label: "フォロワー" },
          { val: profile.followingCount,  label: "フォロー中" },
          { val: profile.totalLikeCount,  label: "総いいね" },
        ].map((s, i) => (
          <div key={i} className="flex-1 text-center border-r border-border last:border-r-0">
            <p className="text-[17px] font-medium text-text-1 leading-none">{formatCount(s.val)}</p>
            <p className="text-[9.5px] text-text-3 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   投稿作品タブ
══════════════════════════════════════ */
function WorksTab() {
  const myWorks = MOCK_WORKS.filter(w => w.author.id === "user-001");
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-text-1">投稿作品</p>
        <Link href="/editor" className="text-[11px] text-accent hover:text-accent-lt transition-colors">
          ＋ 新しい作品
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {myWorks.map(w => {
          const grad = getWorkGradient(w.id);
          return (
            <div key={w.id}
              className="flex items-center gap-3 px-3 py-3 bg-bg-card border border-border rounded-lg hover:border-accent-lt/20 hover:bg-bg-card2 transition-all cursor-pointer"
              onClick={() => window.location.href = `/works/${w.id}`}>
              <div className="w-11 h-[60px] rounded-md flex-shrink-0" style={{ background: grad }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-1 truncate mb-1">{w.title}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge status={w.serialStatus} />
                  <ReadingModeBadge mode={w.readingMode} />
                </div>
                <p className="text-[10px] text-text-3 mt-1.5">
                  ♥ {formatCount(w.likeCount)} · {w.episodeCount}話
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); window.location.href = "/editor"; }}
                className="text-[10.5px] px-3 py-1.5 rounded-lg bg-accent-dim border border-accent-lt/25 text-accent-lt hover:bg-accent/20 transition-colors flex-shrink-0"
              >
                編集
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   通知タブ
══════════════════════════════════════ */
function NotificationsTab({ notifs, onMarkRead, onMarkAll }: {
  notifs: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-text-1">通知</p>
        <button onClick={onMarkAll} className="text-[11px] text-accent hover:text-accent-lt transition-colors">
          すべて既読
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => { if (!n.isRead) onMarkRead(n.id); }}
            className={cn(
              "flex items-start gap-2.5 px-3 py-3 rounded-lg border transition-all cursor-pointer",
              n.isRead
                ? "bg-bg-card border-border"
                : "bg-accent/7 border-accent-lt/20 hover:bg-accent/10"
            )}
          >
            <span className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5",
              n.isRead ? "bg-white/12" : "bg-accent"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-text-2 leading-[1.6]">
                {n.actorName && (
                  <span className="text-accent-lt">{n.actorName}</span>
                )}{" "}
                {getNotifText(n).replace(n.actorName ?? "", "").trim()}
              </p>
              <p className="text-[10px] text-text-3 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
            {!n.isRead && (
              <button
                onClick={e => { e.stopPropagation(); onMarkRead(n.id); }}
                className="text-[9.5px] px-2 py-0.5 rounded border border-border text-text-3 hover:text-accent-lt hover:border-accent-lt/30 transition-all flex-shrink-0"
              >
                既読
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   フォロー中タブ
══════════════════════════════════════ */
function FollowingTab() {
  const following = [
    { id: "u2", name: "塩と珊瑚",  id_str: "@shio_sango",  genres: "SF · ファンタジー", works: 3 },
    { id: "u3", name: "雨硝子",    id_str: "@ame_glass",   genres: "ホラー · ミステリー", works: 5 },
    { id: "u4", name: "碧の夜想",  id_str: "@midori_sou",  genres: "ファンタジー · 恋愛", works: 2 },
  ];
  const colors = ["linear-gradient(135deg,#2e1f52,#7b4a8a)", "linear-gradient(135deg,#0f2a38,#1d9e75)", "linear-gradient(135deg,#0f1e38,#378add)"];
  return (
    <div className="px-4 pt-4 flex flex-col gap-2">
      {following.map((u, i) => (
        <div key={u.id}
          className="flex items-center gap-3 px-3 py-3 bg-bg-card border border-border rounded-lg hover:border-accent-lt/20 hover:bg-bg-card2 transition-all cursor-pointer">
          <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-medium text-white"
            style={{ background: colors[i] }}>
            {u.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text-1">{u.name}</p>
            <p className="text-[10px] text-text-3 mt-0.5">{u.id_str}</p>
            <p className="text-[10px] text-text-2 mt-1">{u.genres}</p>
          </div>
          <p className="text-[10px] text-text-3 flex-shrink-0">作品 {u.works}件</p>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   設定ドロワー
══════════════════════════════════════ */
function SettingsDrawer({ profile, onClose, onLogout }: {
  profile: typeof MOCK_ME;
  onClose: () => void;
  onLogout: () => void;
}) {
  const items = [
    { icon: "👤", label: "マイページ",    onClick: onClose },
    { icon: "✏️", label: "執筆エディタ", onClick: () => window.location.href = "/editor" },
    { icon: "🔔", label: "通知設定",     onClick: () => alert("通知設定") },
    { icon: "⚙️", label: "アカウント設定", onClick: () => alert("アカウント設定") },
    { icon: "🌙", label: "テーマ設定",   onClick: () => alert("テーマ設定") },
    { icon: "📄", label: "利用規約",     onClick: () => alert("利用規約") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[min(300px,88vw)] bg-bg-card2 border-l border-border-2 flex flex-col overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-bg-card2">
          <p className="text-[14px] font-medium text-text-1">メニュー</p>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 border border-border flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* ユーザー情報 */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-medium text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#534ab7,#7a5dc7)" }}>
            {profile.displayName.charAt(0)}
          </div>
          <div>
            <p className="text-[14px] font-medium text-text-1">{profile.displayName}</p>
            <p className="text-[11px] text-text-3">@{profile.username}</p>
          </div>
        </div>

        {/* メニュー項目 */}
        <div className="py-2">
          {items.map((item, i) => (
            <button key={i} onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-text-2 hover:bg-white/3 transition-colors text-left">
              <span className="w-5 text-center text-sm">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-text-3">›</span>
            </button>
          ))}

          <div className="h-px bg-border mx-4 my-1" />

          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[#f0997b] hover:bg-coral/5 transition-colors">
            <span className="w-5 text-center text-sm">🚪</span>
            <span>ログアウト</span>
          </button>
        </div>

        <div className="mt-auto px-4 py-4 text-[10px] text-text-3">
          NovelFlow v1.0.0
        </div>
      </div>
    </div>
  );
}
