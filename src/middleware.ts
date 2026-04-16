import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* ══════════════════════════════════════
   保護ルート（未認証でアクセスするとログインページへ）
══════════════════════════════════════ */
const PROTECTED_ROUTES = [
  "/editor",
  "/library",
  "/mypage",
  "/settings",
];

/* ══════════════════════════════════════
   認証後リダイレクト（ログイン済みでアクセスするとホームへ）
══════════════════════════════════════ */
const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
];

export async function middleware(request: NextRequest) {
  // TODO: 開発用に認証チェックを無効化中。本番前に必ず有効化すること。
  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
