"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

/* ══════════════════════════════════════
   ログインページ（useSearchParams は Suspense 必須）
══════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}

/* ── 登録ページは別ルートから同コンポーネントを使う ── */
export function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <AuthPage initialMode="register" />
    </Suspense>
  );
}

function AuthPage({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const sb = createClient();
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
      } else {
        const { error } = await sb.auth.signUp({
          email, password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        setMessage("確認メールを送信しました。メールのリンクをクリックして登録を完了してください。");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      setError(
        msg.includes("環境変数が設定されていません") ? "サーバー設定エラー：管理者にお問い合わせください（環境変数未設定）" :
        msg.includes("Invalid API key")            ? "サーバー設定エラー：Supabase APIキーが無効です。Vercel の環境変数を確認してください" :
        msg.includes("Invalid login credentials")  ? "メールアドレスまたはパスワードが正しくありません" :
        msg.includes("Email already registered")   ? "このメールアドレスは既に登録されています" :
        msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "github") => {
    const sb = createClient();
    await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirectTo}` },
    });
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full left-1/2 -translate-x-1/2 -top-40 opacity-50"
          style={{ background: "radial-gradient(circle, rgba(122,93,199,0.15) 0%, transparent 70%)" }} />
      </div>

      {/* ロゴ */}
      <Link href="/" className="font-serif text-[22px] text-accent-lt mb-8 relative z-10">
        Novel<span className="text-accent">Flow</span>
      </Link>

      {/* カード */}
      <div className="w-full max-w-[400px] bg-bg-card border border-border rounded-xl p-8 relative z-10">
        {/* タブ */}
        <div className="flex rounded-lg overflow-hidden border border-border mb-6">
          {(["login", "register"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={cn(
                "flex-1 py-2.5 text-sm transition-colors duration-200",
                mode === m
                  ? "bg-accent-2 text-white"
                  : "bg-transparent text-text-2 hover:text-text-1"
              )}
            >
              {m === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>

        {/* エラー・メッセージ */}
        {error   && <div className="mb-4 px-3 py-2.5 rounded-lg bg-coral/12 border border-coral/25 text-[#f0997b] text-xs">{error}</div>}
        {message && <div className="mb-4 px-3 py-2.5 rounded-lg bg-teal/12 border border-teal/25 text-[#5dcaa5] text-xs">{message}</div>}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <label className="text-[11px] text-text-2 mb-1.5 block">表示名</label>
              <input
                type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="ニックネーム" required maxLength={50}
                className="input-dark"
              />
            </div>
          )}
          <div>
            <label className="text-[11px] text-text-2 mb-1.5 block">メールアドレス</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" required
              className="input-dark"
            />
          </div>
          <div>
            <label className="text-[11px] text-text-2 mb-1.5 block">パスワード</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="8文字以上" required minLength={8}
              className="input-dark"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 rounded-xl text-sm mt-1 disabled:opacity-50"
            style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.35)" }}
          >
            {loading ? "処理中…" : mode === "login" ? "ログイン" : "アカウントを作成"}
          </button>
        </form>

        {/* 区切り */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-text-3">または</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ソーシャルログイン */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => handleSocial("google")}
            className="flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border-2 text-text-2 text-sm hover:border-border hover:text-text-1 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleで{mode === "login" ? "ログイン" : "登録"}
          </button>
        </div>

        {mode === "login" && (
          <p className="text-center mt-4 text-[11px] text-text-3">
            アカウントをお持ちでない方は{" "}
            <button onClick={() => setMode("register")} className="text-accent hover:text-accent-lt transition-colors">
              新規登録
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
