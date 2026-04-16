import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_WORKS, MOCK_CHAPTERS, MOCK_PACKS } from "@/lib/mock-data";
import { WorkDetailClient } from "./WorkDetailClient";

interface Props {
  params: { workId: string };
}

/* サーバーサイドでメタデータ生成 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = MOCK_WORKS.find(w => w.id === params.workId);
  if (!work) return { title: "作品が見つかりません" };
  return {
    title: `${work.title} — ${work.author.displayName}`,
    description: work.synopsis ?? undefined,
    openGraph: {
      title: work.title,
      description: work.synopsis ?? undefined,
    },
  };
}

/* 静的パス（ビルド時生成） */
export function generateStaticParams() {
  return MOCK_WORKS.map(w => ({ workId: w.id }));
}

export default function WorkDetailPage({ params }: Props) {
  const work = MOCK_WORKS.find(w => w.id === params.workId);
  if (!work) notFound();

  const chapters = MOCK_CHAPTERS;
  const packs    = MOCK_PACKS.filter(p => p.workId === params.workId);

  return (
    <WorkDetailClient
      work={work!}
      chapters={chapters}
      packs={packs}
    />
  );
}
