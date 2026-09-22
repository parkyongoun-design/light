import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/tickets";
import { MISSION_PARTS, PART_LABEL } from "@/lib/parts";
import Nav from "@/components/Nav";
import MissionRow from "../MissionRow";

export default async function PartMissionsPage({ params }: { params: { part: string } }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role === "ADMIN") redirect("/admin");

  const part = params.part.toUpperCase();
  if (!(MISSION_PARTS as readonly string[]).includes(part)) notFound();

  const settings = await getSettings();
  if (part === "HOLIDAY" && !settings.showHolidayMissions) redirect("/zone");

  const deadlinePassed = Boolean(settings.missionDeadline && new Date() > settings.missionDeadline);
  const [missions, completions] = await Promise.all([
    prisma.mission.findMany({ where: { active: true, part }, orderBy: { order: "asc" } }),
    prisma.missionCompletion.findMany({ where: { memberId: member.id, mission: { part } }, select: { missionId: true } }),
  ]);

  const doneIds = new Set(completions.map((c) => c.missionId));
  const categories = [...new Set(missions.map((m) => m.category))];

  return (
    <>
      <Nav name={member.name} role={member.role} active="zone" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/zone" className="mb-3 inline-block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          ← 우리 조으로
        </Link>
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {PART_LABEL[part]} 미션
          </h1>
          <span className="tabular text-xs" style={{ color: "var(--text-muted)" }}>
            {doneIds.size}/{missions.length}개 완료
          </span>
        </div>

        {deadlinePassed && (
          <p className="mb-4 rounded-lg px-3 py-2 text-center text-xs font-medium" style={{ background: "var(--status-critical)", color: "#fff" }}>
            미션이 마감되었습니다
          </p>
        )}

        {categories.map((name) => (
          <div key={name} className="mb-4">
            {name && (
              <h2 className="mb-1.5 px-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {name}
              </h2>
            )}
            <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
              {missions
                .filter((m) => m.category === name)
                .map((mission) => (
                  <MissionRow
                    key={mission.id}
                    missionId={mission.id}
                    title={mission.title}
                    points={mission.points}
                    hard={mission.difficulty === "HARD"}
                    initialDone={doneIds.has(mission.id)}
                    locked={deadlinePassed}
                  />
                ))}
            </div>
          </div>
        ))}
        {missions.length === 0 && (
          <p className="card px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            아직 등록된 미션이 없습니다.
          </p>
        )}
      </main>
    </>
  );
}
