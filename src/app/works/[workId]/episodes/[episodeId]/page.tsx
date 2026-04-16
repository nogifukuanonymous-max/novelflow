import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MOCK_WORKS, MOCK_CHAPTERS } from "@/lib/mock-data";
import { ReaderClient } from "./ReaderClient";

interface Props {
  params: { workId: string; episodeId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = MOCK_WORKS.find(w => w.id === params.workId);
  const allEps = MOCK_CHAPTERS.flatMap(c => c.episodes);
  const episode = allEps.find(e => e.id === params.episodeId);
  if (!work || !episode) return { title: "エピソードが見つかりません" };
  return {
    title: `${episode.title} — ${work.title}`,
    // 読書画面はインデックスしない
    robots: { index: false },
  };
}

export function generateStaticParams() {
  const allEps = MOCK_CHAPTERS.flatMap(c => c.episodes);
  return allEps.map(ep => ({
    workId: ep.workId,
    episodeId: ep.id,
  }));
}

export default function ReaderPage({ params }: Props) {
  const work = MOCK_WORKS.find(w => w.id === params.workId);
  const allEps = MOCK_CHAPTERS.flatMap(c => c.episodes);
  const episode = allEps.find(e => e.id === params.episodeId);
  if (!work || !episode) notFound();

  const epIndex = allEps.findIndex(e => e.id === params.episodeId);
  const prevEpisode = epIndex > 0 ? allEps[epIndex - 1] : null;
  const nextEpisode = epIndex < allEps.length - 1 ? allEps[epIndex + 1] : null;

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#0f0e14]" />}>
      <ReaderClient
        work={work!}
        episode={episode!}
        chapters={MOCK_CHAPTERS}
        prevEpisode={prevEpisode ?? null}
        nextEpisode={nextEpisode ?? null}
      />
    </Suspense>
  );
}
