"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
      <p className="text-3xl mb-4">⚠</p>
      <h2 className="text-[16px] font-medium text-text-1 mb-2">エラーが発生しました</h2>
      <p className="text-[12px] text-text-3 mb-6 max-w-xs">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full bg-accent-2 text-white text-[13px] hover:bg-accent transition-colors"
        >
          再試行
        </button>
        <Link
          href="/"
          className="px-5 py-2 rounded-full border border-border text-text-2 text-[13px] hover:border-border-2 transition-colors"
        >
          ホームへ
        </Link>
      </div>
    </div>
  );
}
