import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const RARITY_LABEL: Record<string, string> = { COMMON: "일반", RARE: "희귀", EPIC: "에픽", LEGENDARY: "전설" };
const RARITY_COLOR: Record<string, string> = {
  COMMON: "#6B7280",
  RARE: "#2563EB",
  EPIC: "#7C3AED",
  LEGENDARY: "#D97706",
};

export const dynamic = "force-dynamic";

async function getPull(shareId: string) {
  return prisma.gachaPull.findUnique({
    where: { shareId },
    include: { item: true, zone: true },
  });
}

export async function generateMetadata({ params }: { params: { shareId: string } }): Promise<Metadata> {
  const pull = await getPull(params.shareId);
  if (!pull) return { title: "미션 가챠" };
  const who = pull.zone?.name ?? "우리 구역";
  const title = `${pull.item.emoji} ${who}의 뽑기 결과: ${pull.item.name}`;
  const description = pull.item.description || "미션 가챠에서 뽑은 대화거리예요!";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "미션 가챠" },
  };
}

export default async function ResultPage({ params }: { params: { shareId: string } }) {
  const pull = await getPull(params.shareId);
  if (!pull) notFound();

  const { item, zone } = pull;
  const date = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(pull.pulledAt);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <p className="mb-4 text-center text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        🎰 미션 가챠
      </p>
      <div className="card p-6 text-center">
        <p className="mb-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {zone ? `${zone.name}의 뽑기 결과` : "뽑기 결과"}
        </p>
        <p className="mb-1 text-xs font-bold tracking-wide" style={{ color: RARITY_COLOR[item.rarity] }}>
          {RARITY_LABEL[item.rarity] ?? item.rarity}
        </p>
        <div className="my-3 text-7xl">{item.emoji}</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {item.name}
        </h1>
        {item.description && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {item.description}
          </p>
        )}
        {item.linkUrl && (
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--series-1)" }}
          >
            🔗 링크 열기
          </a>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          구역 전체가 함께 즐기는 대화거리 · {date}
        </p>
      </div>
    </main>
  );
}
