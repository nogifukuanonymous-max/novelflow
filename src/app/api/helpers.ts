import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/types";

/* ══════════════════════════════════════
   標準レスポンスヘルパー
══════════════════════════════════════ */
export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, status } }, { status });
}

export const Errors = {
  unauthorized:   () => err("UNAUTHORIZED",    "認証が必要です",                             401),
  forbidden:      () => err("FORBIDDEN",       "権限がありません",                           403),
  notFound:       (r = "リソース") => err("NOT_FOUND", `${r}が見つかりません`,              404),
  conflict:       (m: string) => err("CONFLICT", m,                                          409),
  validation:     (m: string) => err("VALIDATION_ERROR", m,                                  400),
  tooLarge:       (m: string) => err("PAYLOAD_TOO_LARGE", m,                                 413),
  unprocessable:  (code: string, m: string) => err(code, m,                                  422),
  internal:       (m = "サーバーエラーが発生しました") => err("INTERNAL_ERROR", m,          500),
  rateLimited:    () => err("RATE_LIMITED", "リクエストが多すぎます。しばらく待ってください", 429),
} as const;

/* ══════════════════════════════════════
   認証ヘルパー
══════════════════════════════════════ */
export interface AuthContext {
  userId:  string;
  role:    "reader" | "author" | "admin";
  profile: Record<string, unknown>;
}

/**
 * Route Handler 内で認証済みユーザー情報を取得する。
 * 未認証の場合は null を返す（呼び出し元で Errors.unauthorized() を返すこと）。
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const sb = createServerClient(cookies());
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("id, role, display_name, username, is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  if (profile.is_banned) return null;

  return {
    userId:  user.id,
    role:    profile.role as AuthContext["role"],
    profile: profile as Record<string, unknown>,
  };
}

/**
 * 認証 + 管理者チェックを行う Route Handler ラッパー。
 * 
 * 使い方:
 *   export const GET = withAuth(async (req, ctx) => { ... });
 *   export const GET = withAuth(async (req, ctx) => { ... }, { adminOnly: true });
 */
type RouteHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

export function withAuth(
  handler: RouteHandler,
  options: { adminOnly?: boolean; authorOnly?: boolean } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await getAuthContext();
    if (!ctx) return Errors.unauthorized();
    if (options.adminOnly  && ctx.role !== "admin")  return Errors.forbidden();
    if (options.authorOnly && ctx.role === "reader") return Errors.forbidden();

    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error("[API Error]", error);
      if (error instanceof Error) {
        return Errors.internal(error.message);
      }
      return Errors.internal();
    }
  };
}

/* ══════════════════════════════════════
   リクエストボディパーサー
══════════════════════════════════════ */
export async function parseJsonBody<T>(req: NextRequest): Promise<T> {
  try {
    return await req.json() as T;
  } catch {
    throw Object.assign(new Error("リクエストボディのパースに失敗しました"), { statusCode: 400 });
  }
}

/* ══════════════════════════════════════
   バリデーションヘルパー
══════════════════════════════════════ */
export function requireFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): string | null {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === "") {
      return `${String(f)} は必須です`;
    }
  }
  return null;
}

export function validateLength(value: string, max: number, fieldName: string): string | null {
  if (value.length > max) return `${fieldName} は ${max} 文字以内で入力してください`;
  return null;
}

/* ══════════════════════════════════════
   レートリミット（簡易インメモリ実装）
   本番では Upstash Redis + @upstash/ratelimit を使うこと
══════════════════════════════════════ */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // OK
  }

  if (entry.count >= limit) return false; // NG

  entry.count++;
  return true; // OK
}

/* ══════════════════════════════════════
   カーソルページネーション
══════════════════════════════════════ */
export interface PaginationParams {
  cursor?: string;
  limit:   number;
}

export function parsePagination(url: URL, maxLimit = 50): PaginationParams {
  const limitStr = url.searchParams.get("limit");
  const limit    = Math.min(Math.max(parseInt(limitStr ?? "20", 10), 1), maxLimit);
  const cursor   = url.searchParams.get("cursor") ?? undefined;
  return { cursor, limit };
}

export function buildNextCursor<T extends Record<string, unknown>>(
  items: T[],
  limit: number,
  field: keyof T
): string | null {
  if (items.length <= limit) return null;
  const last = items[limit - 1];
  return last ? String(last[field]) : null;
}
