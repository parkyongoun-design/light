import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMemberTicketSummary } from "@/lib/tickets";
import Nav from "@/components/Nav";
import GachaMachine from "./GachaMachine";

export default async function GachaPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const [summary, pulls] = await Promise.all([
    getMemberTicketSummary(member.id),
    prisma.gachaPull.findMany({
      where: { memberId: member.id },
      include: { item: true },
      orderBy: { pulledAt: "desc" },
      take: 30,
    }),
  ]);

  const collectionCounts = new Map<string, { name: string; emoji: string; rarity: string; count: number }>();
  for (const pull of pulls) {
    const key = pull.itemId;
    const prev = collectionCounts.get(key);
    if (prev) prev.count += 1;
    else
      collectionCounts.set(key, {
        name: pull.item.name,
        emoji: pull.item.emoji,
        rarity: pull.item.rarity,
        count: 1,
      });
  }

  return (
    <>
      <Nav name={member.name} role={member.role} active="gacha" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {member.role === "ADMIN" && (
          <p className="mb-3 rounded-lg px-3 py-2 text-center text-xs font-medium" style={{ background: "var(--page-plane)", color: "var(--text-secondary)" }}>
            관리자 미리보기 모드 — 뽑기권 무제한
          </p>
        )}
        <GachaMachine ticketsAvailable={summary.ticketsAvailable} unlimited={member.role === "ADMIN"} memberName={member.name} />

        <div className="mt-8">
          <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            내 컬렉션
          </h2>
          {collectionCounts.size === 0 ? (
            <p className="card px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              아직 뽑은 아이템이 없어요. 첫 뽑기를 해보세요!
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
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  {p.item.emoji} {p.item.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(p.pulledAt)}
                </span>
              </div>
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
