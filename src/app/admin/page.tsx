import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getOrgStats } from "@/lib/stats";
import { getSettings } from "@/lib/tickets";
import Nav from "@/components/Nav";
import BarChart from "@/components/BarChart";
import { PART_LABEL } from "@/lib/parts";
import { updateDisplaySettingsAction } from "./actions";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "ADMIN") redirect("/zone");

  const [{ teamRows, orgTotals }, settings] = await Promise.all([getOrgStats(), getSettings()]);

  const pointsChart = teamRows.map((t) => ({
    label: t.team.name,
    value: t.totalPoints,
    sublabel: `${t.memberCount}명`,
  }));
  const rateChart = teamRows.map((t) => ({
    label: t.team.name,
    value: Math.round(t.completionRate * 100),
  }));

  const teamRateTable = [...teamRows].sort((a, b) => a.completionRate - b.completionRate);
  const zoneRateTable = teamRows
    .flatMap((t) => t.zones.map((z) => ({ teamName: t.team.name, zone: z })))
    .sort((a, b) => a.zone.completionRate - b.zone.completionRate);

  const rateColor = (rate: number) => {
    if (rate < 0.3) return "var(--status-critical)";
    if (rate < 0.5) return "var(--status-warning)";
    return "var(--status-good)";
  };

  return (
    <>
      <Nav name={member.name} role={member.role} active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          전체 현황
        </h1>

        <form action={updateDisplaySettingsAction} className="card mb-6 flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            조원 화면 표시 설정
          </p>
          <label className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" name="showZoneScores" defaultChecked={settings.showZoneScores} className="mt-0.5" />
            <span>
              <b>조원별 점수표 공개</b> — 꺼두면 조 총점·참석률만 보이고, 개인별 점수는 관리자만 봅니다.
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" name="showZoneRanking" defaultChecked={settings.showZoneRanking} className="mt-0.5" />
            <span>
              <b>전체 조 순위 공개</b> — 30조 순위를 보여줍니다. 낮은 순위 조의 동기부여가 걱정되면 꺼두세요.
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" name="showHolidayMissions" defaultChecked={settings.showHolidayMissions} className="mt-0.5" />
            <span>
              <b>명절 미션 공개</b> — 모든 조원에게 명절 미션을 추가로 보여줍니다.
            </span>
          </label>
          <button type="submit" className="self-start rounded-lg px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
            저장
          </button>
        </form>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="총 인원" value={`${orgTotals.memberCount}명`} sub={`${orgTotals.teamCount}팀 · ${orgTotals.zoneCount}조`} />
          <StatTile label="누적 미션 완료" value={`${orgTotals.missionsDone}건`} sub={`미션 ${orgTotals.missionCount}종`} />
          <StatTile label="누적 점수" value={`${orgTotals.totalPoints.toLocaleString()}점`} />
          <StatTile label="사용된 뽑기권" value={`${orgTotals.ticketsUsed}장`} />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              팀별 누적 점수
            </h2>
            <BarChart data={pointsChart} valueFormat={(v) => `${v.toLocaleString()}점`} />
          </div>
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              팀별 미션 완료율
            </h2>
            <BarChart data={rateChart} valueFormat={(v) => `${v}%`} color="var(--series-3)" />
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="card overflow-hidden">
            <h2 className="p-4 pb-0 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              팀별 참석률
            </h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--gridline)" }}>
                  <th className="px-4 py-2 font-medium">팀</th>
                  <th className="px-2 py-2 font-medium">인원</th>
                  <th className="px-4 py-2 font-medium">참석률</th>
                </tr>
              </thead>
              <tbody>
                {teamRateTable.map((t) => (
                  <tr key={t.team.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                      {t.team.name}
                    </td>
                    <td className="tabular px-2 py-2" style={{ color: "var(--text-secondary)" }}>
                      {t.memberCount}명
                    </td>
                    <td className="tabular px-4 py-2 font-semibold" style={{ color: rateColor(t.completionRate) }}>
                      {Math.round(t.completionRate * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden">
            <h2 className="p-4 pb-0 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              조별 참석률 (낮은 순)
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--gridline)" }}>
                    <th className="px-4 py-2 font-medium">조</th>
                    <th className="px-2 py-2 font-medium">인원</th>
                    <th className="px-4 py-2 font-medium">참석률</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneRateTable.map(({ teamName, zone: z }) => (
                    <tr key={z.zone.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                      <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>
                        {z.zone.name}
                        <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          {teamName}
                        </span>
                      </td>
                      <td className="tabular px-2 py-2" style={{ color: "var(--text-secondary)" }}>
                        {z.memberCount}명
                      </td>
                      <td className="tabular px-4 py-2 font-semibold" style={{ color: rateColor(z.completionRate) }}>
                        {z.completionRate < 0.3 && "⚠️ "}
                        {Math.round(z.completionRate * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          팀 · 조 · 조원 상세
        </h2>
        <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
          {teamRows.map((t) => (
            <details key={t.team.id} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {t.team.name}
                </span>
                <span className="tabular text-xs" style={{ color: "var(--text-muted)" }}>
                  {t.memberCount}명 · {t.totalPoints.toLocaleString()}점 · 완료율 {Math.round(t.completionRate * 100)}%
                </span>
              </summary>
              <div className="mt-2 space-y-2 pl-3">
                {t.zones.map((z) => (
                  <details key={z.zone.id} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--gridline)" }}>
                    <summary className="flex cursor-pointer list-none items-center justify-between">
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {z.zone.name}
                      </span>
                      <span className="tabular text-xs" style={{ color: "var(--text-muted)" }}>
                        {z.memberCount}명 · {z.totalPoints.toLocaleString()}점 · 뽑기권 {z.ticketsAvailable}장 · 참석률 {Math.round(z.completionRate * 100)}%
                      </span>
                    </summary>
                    <table className="mt-2 w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "var(--text-muted)" }}>
                          <th className="py-1 font-medium">이름</th>
                          <th className="py-1 font-medium">파트</th>
                          <th className="py-1 font-medium">완료</th>
                          <th className="py-1 font-medium">점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {z.memberRows.map(({ member: m, stat }) => (
                          <tr key={m.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                            <td className="py-1.5" style={{ color: "var(--text-primary)" }}>
                              {m.name}
                              {m.isZoneLeader && (
                                <span className="ml-1 rounded px-1 py-0.5 text-[10px]" style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}>
                                  조장
                                </span>
                              )}
                            </td>
                            <td className="py-1.5" style={{ color: "var(--text-secondary)" }}>
                              {PART_LABEL[m.part]}
                            </td>
                            <td className="tabular py-1.5">
                              {stat.missionsDone}/{stat.missionsAvailable}
                            </td>
                            <td className="tabular py-1.5">{stat.totalPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
