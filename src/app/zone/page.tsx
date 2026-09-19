import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings, getZoneTicketSummary, visibleMissionWhere } from "@/lib/tickets";
import { getOrgStats } from "@/lib/stats";
import { PART_LABEL } from "@/lib/parts";
import Nav from "@/components/Nav";
import { toggleMissionAction } from "./actions";

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
    prisma.mission.findMany({
      where: visibleMissionWhere(member.part, settings.showHolidayMissions),
      orderBy: { order: "asc" },
    }),
    prisma.missionCompletion.findMany({ where: { memberId: member.id } }),
    member.zoneId ? getZoneTicketSummary(member.zoneId) : Promise.resolve(null),
    member.zoneId ? getOrgStats() : Promise.resolve(null),
  ]);

  const doneIds = new Set(completions.map((c) => c.missionId));
  const myDone = missions.filter((m) => doneIds.has(m.id)).length;

  const sections = [member.part, "HOLIDAY"]
    .filter((part) => missions.some((m) => m.part === part))
    .map((part) => {
      const list = missions.filter((m) => m.part === part);
      const categories = [...new Set(list.map((m) => m.category))];
      return { part, categories: categories.map((c) => ({ name: c, missions: list.filter((m) => m.category === c) })) };
    });

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
            {myZoneStats.team.name} · {myZoneStats.zone.zone.name} · {PART_LABEL[member.part]}
            {member.isZoneLeader && " · 구역장"}
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
                  우리 구역 뽑기권
                </p>
                <p className="text-3xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
                  {summary.ticketsAvailable}장
                </p>
              </div>
              <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                <p>구역 점수 {summary.totalPoints}점</p>
                <p>구역 참석률 {Math.round(myZoneStats.zone.completionRate * 100)}%</p>
                <p>다음 뽑기권까지 {summary.pointsPerTicket - summary.pointsIntoNextTicket}점</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--gridline)" }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "var(--series-1)" }} />
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              내 미션 {myDone}/{missions.length}개 완료 · 뽑기는 구역장이 대표로 해요
            </p>
          </div>
        )}

        {sections.map(({ part, categories }) => (
          <div key={part} className="mb-6">
            <h2 className="mb-3 px-1 text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {part === "HOLIDAY" ? "🌕 명절 미션" : `${PART_LABEL[part]} 미션`}
            </h2>
            {categories.map(({ name, missions: list }) => (
              <div key={name} className="mb-4">
                {name && (
                  <h3 className="mb-1.5 px-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {name}
                  </h3>
                )}
                <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
                  {list.map((mission) => {
                    const done = doneIds.has(mission.id);
                    return (
                      <form
                        key={mission.id}
                        action={toggleMissionAction.bind(null, mission.id)}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}
                          >
                            {mission.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {mission.points}점{mission.difficulty === "HARD" && " · 어려움"}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={deadlinePassed}
                          className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                          style={
                            done
                              ? { background: "var(--gridline)", color: "var(--text-secondary)" }
                              : { background: "var(--series-1)", color: "#fff" }
                          }
                        >
                          {deadlinePassed ? (done ? "완료" : "마감됨") : done ? "완료 취소" : "완료 체크"}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="card mb-6 px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            아직 등록된 미션이 없습니다.
          </p>
        )}

        {settings.showZoneScores && myZoneStats && (
          <div className="mb-5">
            <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {myZoneStats.zone.zone.name} 구역원별 점수
            </h2>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--gridline)" }}>
                    <th className="px-4 py-2 font-medium">이름</th>
                    <th className="px-2 py-2 font-medium">파트</th>
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
                              구역장
                            </span>
                          )}
                          {m.id === member.id && (
                            <span className="ml-1 text-[10px]" style={{ color: "var(--series-1)" }}>
                              나
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2" style={{ color: "var(--text-secondary)" }}>
                          {PART_LABEL[m.part]}
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
                전체 구역 순위
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--series-1)" }}>
                우리 구역 {myRank.rank}위 / {ranked.length}구역
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
                                (우리 구역)
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
