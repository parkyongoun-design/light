import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings, getZoneTicketSummary } from "@/lib/tickets";
import { getOrgStats } from "@/lib/stats";
import { PART_LABEL, PART_BUTTON_ORDER, PART_EMOJI } from "@/lib/parts";
import Nav from "@/components/Nav";
import PartCard from "./PartCard";

export default async function ZonePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role === "ADMIN") redirect("/admin");

  const settings = await getSettings();
  const deadlinePassed = Boolean(settings.missionDeadline && new Date() > settings.missionDeadline);
  const deadlineLabel = settings.missionDeadline
    ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(settings.missionDeadline)
    : null;

  const [missions, completions, summary, orgStats] = await Promise.all([
    prisma.mission.findMany({ where: { active: true }, select: { id: true, part: true }, orderBy: { order: "asc" } }),
    prisma.missionCompletion.findMany({ where: { memberId: member.id } }),
    member.zoneId ? getZoneTicketSummary(member.zoneId) : Promise.resolve(null),
    member.zoneId ? getOrgStats(settings.showZoneRanking ? {} : { zoneId: member.zoneId }) : Promise.resolve(null),
  ]);

  const doneIds = new Set(completions.map((c) => c.missionId));
  const partStats = PART_BUTTON_ORDER.filter((part) => part !== "HOLIDAY" || settings.showHolidayMissions).map((part) => {
    const list = missions.filter((m) => m.part === part);
    return { part, total: list.length, done: list.filter((m) => doneIds.has(m.id)).length };
  });
  const myVisibleMissions = missions.filter((m) => m.part !== "HOLIDAY" || settings.showHolidayMissions);
  const myDone = myVisibleMissions.filter((m) => doneIds.has(m.id)).length;

  const allZones = orgStats?.teamRows.flatMap((t) => t.zones.map((z) => ({ team: t.team, zone: z }))) ?? [];
  const myZoneStats = allZones.find((e) => e.zone.zone.id === member.zoneId) ?? null;
  const ranked = [...allZones]
    .sort((a, b) => b.zone.totalPoints - a.zone.totalPoints)
    .map((e, idx) => ({ rank: idx + 1, entry: e, isMine: e.zone.zone.id === member.zoneId }));
  const myRank = ranked.find((r) => r.isMine) ?? null;

  const progressPct = summary ? Math.min(100, Math.round((summary.pointsIntoNextTicket / summary.pointsPerTicket) * 100)) : 0;

  return (
    <>
      <Nav name={member.name} role={member.role} active="zone" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {myZoneStats && (
          <p className="mb-4 px-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {myZoneStats.team.name} · {myZoneStats.zone.zone.name}
            {(member.title || member.isZoneLeader) && ` · ${member.title || "조장"}`}
          </p>
        )}

        {deadlineLabel && (
          <p
            className="mb-4 rounded-lg px-3 py-2 text-center text-xs font-medium"
            style={
              deadlinePassed
                ? { background: "var(--status-critical)", color: "#fff" }
                : { background: "var(--page-plane)", color: "var(--text-secondary)" }
            }
          >
            {deadlinePassed ? `미션이 마감되었습니다 (마감: ${deadlineLabel})` : `미션 마감: ${deadlineLabel}까지`}
          </p>
        )}

        {summary && myZoneStats && (
          <div className="card mb-6 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  우리 조 뽑기권
                </p>
                <p className="text-3xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
                  {summary.ticketsAvailable}장
                </p>
              </div>
              <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                <p>조 점수 {summary.totalPoints}점</p>
                <p>조 참석률 {Math.round(myZoneStats.zone.completionRate * 100)}%</p>
                <p>다음 뽑기권까지 {summary.pointsPerTicket - summary.pointsIntoNextTicket}점</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--gridline)" }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "var(--series-1)" }} />
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              내 미션 {myDone}/{myVisibleMissions.length}개 완료 · 뽑기는 조장이 대표로 해요
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          {partStats.map(({ part, total, done }) => (
            <PartCard
              key={part}
              part={part}
              label={PART_LABEL[part]}
              emoji={PART_EMOJI[part]}
              done={done}
              total={total}
            />
          ))}
        </div>

        {settings.showZoneScores && myZoneStats && (
          <div className="mb-5">
            <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {myZoneStats.zone.zone.name} 조원별 점수
            </h2>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--gridline)" }}>
                    <th className="px-4 py-2 font-medium">이름</th>
                    <th className="px-2 py-2 font-medium">직책</th>
                    <th className="px-2 py-2 font-medium">완료</th>
                    <th className="px-4 py-2 font-medium">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {[...myZoneStats.zone.memberRows]
                    .sort((a, b) => b.stat.totalPoints - a.stat.totalPoints)
                    .map(({ member: m, stat }) => (
                      <tr key={m.id} style={{ borderTop: "1px solid var(--gridline)", background: m.id === member.id ? "var(--page-plane)" : "transparent" }}>
                        <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                          {m.name}
                          {m.isZoneLeader && (
                            <span className="ml-1 rounded px-1 py-0.5 text-[10px]" style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}>
                              조장
                            </span>
                          )}
                          {m.id === member.id && (
                            <span className="ml-1 text-[10px]" style={{ color: "var(--series-1)" }}>
                              나
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2" style={{ color: "var(--text-secondary)" }}>
                          {m.title || "-"}
                        </td>
                        <td className="tabular px-2 py-2">
                          {stat.missionsDone}/{stat.missionsAvailable}
                        </td>
                        <td className="tabular px-4 py-2">{stat.totalPoints}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {settings.showZoneRanking && myRank && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                전체 조 순위
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--series-1)" }}>
                우리 조 {myRank.rank}위 / {ranked.length}조
              </span>
            </div>
            <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
              {(() => {
                const top = ranked.slice(0, 5);
                const rows = myRank.rank > 5 ? [...top, myRank] : top;
                return rows.map((r, i) => (
                  <div key={r.entry.zone.zone.id}>
                    {myRank.rank > 5 && i === rows.length - 1 && (
                      <div className="px-4 py-1 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        ⋯
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm" style={{ background: r.isMine ? "var(--page-plane)" : "transparent" }}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center tabular font-bold" style={{ color: r.rank <= 3 ? "var(--series-4)" : "var(--text-muted)" }}>
                          {r.rank}
                        </span>
                        <div>
                          <p style={{ color: "var(--text-primary)" }}>
                            {r.entry.zone.zone.name}
                            {r.isMine && (
                              <span className="ml-1 text-xs" style={{ color: "var(--series-1)" }}>
                                (우리 조)
                              </span>
                            )}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {r.entry.team.name} · 참석률 {Math.round(r.entry.zone.completionRate * 100)}%
                          </p>
                        </div>
                      </div>
                      <span className="tabular font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {r.entry.zone.totalPoints.toLocaleString()}점
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
