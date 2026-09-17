import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMemberTicketSummary, getPointsPerTicket, getSettings } from "@/lib/tickets";
import { getOrgStats } from "@/lib/stats";
import Nav from "@/components/Nav";
import { toggleMissionAction } from "./actions";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "쉬움",
  MEDIUM: "보통",
  HARD: "어려움",
};

const DIFFICULTY_DOT: Record<string, string> = {
  EASY: "var(--series-3)",
  MEDIUM: "var(--series-4)",
  HARD: "var(--series-2)",
};

export default async function ZonePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role === "ADMIN") redirect("/admin");

  const [missions, completions, summary] = await Promise.all([
    prisma.mission.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.missionCompletion.findMany({ where: { memberId: member.id } }),
    getMemberTicketSummary(member.id),
  ]);

  const doneIds = new Set(completions.map((c) => c.missionId));
  const grouped = ["EASY", "MEDIUM", "HARD"].map((diff) => ({
    diff,
    missions: missions.filter((m) => m.difficulty === diff),
  }));

  const progressPct = Math.min(100, Math.round((summary.pointsIntoNextTicket / summary.pointsPerTicket) * 100));

  let zoneBoard: {
    zoneName: string;
    teamName: string;
    rows: { id: string; name: string; isZoneLeader: boolean; missionsDone: number; points: number; ticketsUsed: number }[];
  } | null = null;

  if (member.zoneId) {
    const [zone, pointsPerTicket] = await Promise.all([
      prisma.zone.findUnique({
        where: { id: member.zoneId },
        include: {
          team: true,
          members: {
            where: { role: "MEMBER" },
            orderBy: [{ isZoneLeader: "desc" }, { name: "asc" }],
            include: { completions: { include: { mission: true } }, pulls: true },
          },
        },
      }),
      getPointsPerTicket(),
    ]);

    if (zone) {
      zoneBoard = {
        zoneName: zone.name,
        teamName: zone.team.name,
        rows: zone.members
          .map((m) => {
            const points = m.completions.reduce((sum, c) => sum + c.mission.points, 0);
            return {
              id: m.id,
              name: m.name,
              isZoneLeader: m.isZoneLeader,
              missionsDone: m.completions.length,
              points,
              ticketsUsed: m.pulls.length,
            };
          })
          .sort((a, b) => b.points - a.points),
      };
    }
  }

  let zoneRanking: {
    rank: number;
    zoneId: string;
    zoneName: string;
    teamName: string;
    totalPoints: number;
    completionRate: number;
    isMine: boolean;
  }[] = [];
  let myRank: (typeof zoneRanking)[number] | null = null;

  const settings = await getSettings();
  const deadlinePassed = Boolean(settings.missionDeadline && new Date() > settings.missionDeadline);
  const deadlineLabel = settings.missionDeadline
    ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(settings.missionDeadline)
    : null;

  if (member.zoneId && settings.showZoneRanking) {
    const { teamRows } = await getOrgStats();
    const ranked = teamRows
      .flatMap((t) => t.zones.map((z) => ({ team: t.team, zone: z })))
      .sort((a, b) => b.zone.totalPoints - a.zone.totalPoints)
      .map((entry, idx) => ({
        rank: idx + 1,
        zoneId: entry.zone.zone.id,
        zoneName: entry.zone.zone.name,
        teamName: entry.team.name,
        totalPoints: entry.zone.totalPoints,
        completionRate: entry.zone.completionRate,
        isMine: entry.zone.zone.id === member.zoneId,
      }));
    zoneRanking = ranked;
    myRank = ranked.find((r) => r.isMine) ?? null;
  }

  return (
    <>
      <Nav name={member.name} role={member.role} active="zone" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {zoneBoard && (
          <p className="mb-4 px-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {zoneBoard.teamName} · {zoneBoard.zoneName}
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

        <div className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                보유 뽑기권
              </p>
              <p className="text-3xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
                {summary.ticketsAvailable}장
              </p>
            </div>
            <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
              <p>누적 점수 {summary.totalPoints}점</p>
              <p>
                다음 뽑기권까지 {summary.pointsPerTicket - summary.pointsIntoNextTicket}점
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--gridline)" }}>
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "var(--series-1)" }} />
          </div>
        </div>

        {grouped.map(({ diff, missions: list }) => (
          <div key={diff} className="mb-5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full" style={{ background: DIFFICULTY_DOT[diff] }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {DIFFICULTY_LABEL[diff]}
              </h2>
            </div>
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
                        {mission.points}점
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
              {list.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  등록된 미션이 없습니다.
                </p>
              )}
            </div>
          </div>
        ))}

        {zoneBoard && (
          <div className="mb-5">
            <h2 className="mb-2 px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {zoneBoard.zoneName} 현황
            </h2>
            <div className="card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--gridline)" }}>
                    <th className="px-4 py-2 font-medium">이름</th>
                    <th className="px-2 py-2 font-medium">완료 미션</th>
                    <th className="px-2 py-2 font-medium">점수</th>
                    <th className="px-4 py-2 font-medium">뽑은 횟수</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneBoard.rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderTop: "1px solid var(--gridline)",
                        background: row.id === member.id ? "var(--page-plane)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                        {row.name}
                        {row.isZoneLeader && (
                          <span className="ml-1 rounded px-1 py-0.5 text-[10px]" style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}>
                            구역장
                          </span>
                        )}
                        {row.id === member.id && (
                          <span className="ml-1 text-[10px]" style={{ color: "var(--series-1)" }}>
                            나
                          </span>
                        )}
                      </td>
                      <td className="tabular px-2 py-2">{row.missionsDone}</td>
                      <td className="tabular px-2 py-2">{row.points}</td>
                      <td className="tabular px-4 py-2">{row.ticketsUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {zoneRanking.length > 0 && myRank && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                전체 구역 순위
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--series-1)" }}>
                우리 구역 {myRank.rank}위 / {zoneRanking.length}구역
              </span>
            </div>
            <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
              {(() => {
                const top = zoneRanking.slice(0, 5);
                const showMineSeparately = myRank.rank > 5;
                const rows = showMineSeparately ? [...top, myRank] : top;
                return rows.map((r, i) => (
                  <div key={r.zoneId}>
                    {showMineSeparately && i === rows.length - 1 && (
                      <div className="px-4 py-1 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        ⋯
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                      style={{ background: r.isMine ? "var(--page-plane)" : "transparent" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 text-center tabular font-bold"
                          style={{ color: r.rank <= 3 ? "var(--series-4)" : "var(--text-muted)" }}
                        >
                          {r.rank}
                        </span>
                        <div>
                          <p style={{ color: "var(--text-primary)" }}>
                            {r.zoneName}
                            {r.isMine && (
                              <span className="ml-1 text-xs" style={{ color: "var(--series-1)" }}>
                                (우리 구역)
                              </span>
                            )}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {r.teamName} · 완료율 {Math.round(r.completionRate * 100)}%
                          </p>
                        </div>
                      </div>
                      <span className="tabular font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {r.totalPoints.toLocaleString()}점
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
