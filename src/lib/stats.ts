import { prisma } from "./db";
import { getSettings } from "./tickets";

export async function getOrgStats(opts: { zoneId?: string } = {}) {
  const { zoneId } = opts;
  const [teams, missions, settings, pullCounts] = await Promise.all([
    prisma.team.findMany({
      where: zoneId ? { zones: { some: { id: zoneId } } } : undefined,
      orderBy: { order: "asc" },
      include: {
        zones: {
          where: zoneId ? { id: zoneId } : undefined,
          orderBy: { order: "asc" },
          include: {
            members: {
              where: { role: "MEMBER", active: true },
              orderBy: [{ isZoneLeader: "desc" }, { name: "asc" }],
              include: { completions: { include: { mission: true } } },
            },
          },
        },
      },
    }),
    prisma.mission.findMany({ where: { active: true }, select: { part: true } }),
    getSettings(),
    prisma.gachaPull.groupBy({ by: ["zoneId"], _count: { _all: true }, where: zoneId ? { zoneId } : { zoneId: { not: null } } }),
  ]);

  const { pointsPerTicket, showHolidayMissions } = settings;
  const missionsByPart = new Map<string, number>();
  for (const m of missions) missionsByPart.set(m.part, (missionsByPart.get(m.part) ?? 0) + 1);
  const holidayCount = showHolidayMissions ? missionsByPart.get("HOLIDAY") ?? 0 : 0;
  const pullsByZone = new Map(pullCounts.map((p) => [p.zoneId as string, p._count._all]));

  type MemberRow = (typeof teams)[number]["zones"][number]["members"][number];
  const memberStat = (m: MemberRow) => {
    const visibleIds = (mission: { part: string; active: boolean }) =>
      mission.active && (mission.part === m.part || (showHolidayMissions && mission.part === "HOLIDAY"));
    const relevant = m.completions.filter((c) => visibleIds(c.mission));
    const totalPoints = m.completions.filter((c) => c.mission.active).reduce((sum, c) => sum + c.mission.points, 0);
    const available = (missionsByPart.get(m.part) ?? 0) + holidayCount;
    return { totalPoints, missionsDone: relevant.length, missionsAvailable: available };
  };

  const zoneRows = teams.flatMap((team) =>
    team.zones.map((zone) => {
      const memberRows = zone.members.map((m) => ({ member: m, stat: memberStat(m) }));
      const totalPoints = memberRows.reduce((s, r) => s + r.stat.totalPoints, 0);
      const missionsDone = memberRows.reduce((s, r) => s + r.stat.missionsDone, 0);
      const missionsAvailable = memberRows.reduce((s, r) => s + r.stat.missionsAvailable, 0);
      const ticketsUsed = pullsByZone.get(zone.id) ?? 0;
      const ticketsEarned = Math.floor(totalPoints / pointsPerTicket);
      const memberCount = memberRows.length;
      const completionRate = missionsAvailable ? missionsDone / missionsAvailable : 0;
      return {
        zone,
        teamId: team.id,
        memberRows,
        totalPoints,
        missionsDone,
        missionsAvailable,
        ticketsUsed,
        ticketsEarned,
        ticketsAvailable: Math.max(0, ticketsEarned - ticketsUsed),
        memberCount,
        completionRate,
      };
    })
  );

  const teamRows = teams.map((team) => {
    const zones = zoneRows.filter((z) => z.teamId === team.id);
    const totalPoints = zones.reduce((s, z) => s + z.totalPoints, 0);
    const missionsDone = zones.reduce((s, z) => s + z.missionsDone, 0);
    const missionsAvailable = zones.reduce((s, z) => s + z.missionsAvailable, 0);
    const memberCount = zones.reduce((s, z) => s + z.memberCount, 0);
    const ticketsUsed = zones.reduce((s, z) => s + z.ticketsUsed, 0);
    const completionRate = missionsAvailable ? missionsDone / missionsAvailable : 0;
    return { team, zones, totalPoints, missionsDone, memberCount, ticketsUsed, completionRate };
  });

  const orgTotals = {
    totalPoints: teamRows.reduce((s, t) => s + t.totalPoints, 0),
    missionsDone: teamRows.reduce((s, t) => s + t.missionsDone, 0),
    memberCount: teamRows.reduce((s, t) => s + t.memberCount, 0),
    ticketsUsed: teamRows.reduce((s, t) => s + t.ticketsUsed, 0),
    teamCount: teamRows.length,
    zoneCount: zoneRows.length,
    missionCount: missions.length,
  };

  return { teamRows, orgTotals };
}
