import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getZoneTicketSummary } from "@/lib/tickets";
import Nav from "@/components/Nav";
import GachaMachine from "./GachaMachine";

export default async function GachaPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const isAdmin = member.role === "ADMIN";
  const zoneId = member.zoneId;

  const [summary, pulls] = await Promise.all([
    !isAdmin && zoneId ? getZoneTicketSummary(zoneId) : Promise.resolve(null),
    prisma.gachaPull.findMany({
      where: isAdmin ? { memberId: member.id } : { zoneId: zoneId ?? "none" },
      include: { item: true },
      orderBy: { pulledAt: "desc" },
      take: 30,
    }),
  ]);

  const collectionCounts = new Map<string, { name: string; emoji: string; count: number }>();
  for (const pull of pulls) {
    const prev = collectionCounts.get(pull.itemId);
    if (prev) prev.count += 1;
    else collectionCounts.set(pull.itemId, { name: pull.item.name, emoji: pull.item.emoji, count: 1 });
  }

  const canPull = isAdmin || Boolean(member.isZoneLeader && zoneId);

  return (
    <>
      <Nav name={member.name} role={member.role} active="gacha" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {isAdmin && (
          <p className="mb-3 rounded-lg px-3 py-2 text-center text-xs font-medium" style={{ background: "var(--page-plane)", color: "var(--text-secondary)" }}>
            관리자 미리보기 모드 — 뽑기권 무제한
          </p>
        )}
        {!isAdmin && (
          <p className="mb-3 rounded-lg px-3 py-2 text-center text-xs font-medium" style={{ background: "var(--page-plane)", color: "var(--text-secondary)" }}>
            구역 전체가 함께 모은 뽑기권이에요. 뽑기는 구역장이 대표로 해요.
          </p>
        )}
        <GachaMachine
          ticketsAvailable={summary?.ticketsAvailable ?? 0}
          unlimited={isAdmin}
          canPull={canPull}
          memberName={member.name}
        />
        {summary && (
          <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            구역 점수 {summary.totalPoints}점 · 다음 뽑기권까지 {summary.pointsPerTicket - summary.pointsIntoNextTicket}점
          </p>
        )}

        <div className="mt-8">
          <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {isAdmin ? "내 컬렉션" : "우리 구역 컬렉션"}
          </h2>
          {collectionCounts.size === 0 ? (
            <p className="card px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              아직 뽑은 아이템이 없어요.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {[...collectionCounts.values()].map((c) => (
                <div key={c.name} className="card flex flex-col items-center gap-1 p-3">
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-center text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {c.name}
                  </span>
                  <span className="text-xs tabular" style={{ color: "var(--text-muted)" }}>
                    x{c.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            최근 뽑기 기록
          </h2>
          <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
            {pulls.slice(0, 10).map((p) => (
              <Link key={p.id} href={`/result/${p.shareId}`} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  {p.item.emoji} {p.item.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(p.pulledAt)}
                </span>
              </Link>
            ))}
            {pulls.length === 0 && (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                기록이 없습니다.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
