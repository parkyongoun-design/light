import { prisma } from "./db";
import { getPointsPerTicket } from "./tickets";

export async function getOrgStats() {
  const [teams, missions, pointsPerTicket] = await Promise.all([
    prisma.team.findMany({
      orderBy: { order: "asc" },
      include: {
        zones: {
          orderBy: { order: "asc" },
          include: {
            members: {
              where: { role: "MEMBER" },
              orderBy: [{ isZoneLeader: "desc" }, { name: "asc" }],
              include: {
                completions: { include: { mission: true } },
                pulls: true,
              },
            },
          },
        },
      },
    }),
    prisma.mission.count({ where: { active: true } }),
    getPointsPerTicket(),
  ]);

  const memberStat = (m: (typeof teams)[number]["zones"][number]["members"][number]) => {
    const totalPoints = m.completions.reduce((sum, c) => sum + c.mission.points, 0);
    const missionsDone = m.completions.length;
    const ticketsEarned = Math.floor(totalPoints / pointsPerTicket);
    const ticketsUsed = m.pulls.length;
    const ticketsAvailable = Math.max(0, ticketsEarned - ticketsUsed);
    return { totalPoints, missionsDone, ticketsEarned, ticketsUsed, ticketsAvailable };
  };

  const zoneRows = teams.flatMap((team) =>
    team.zones.map((zone) => {
      const memberRows = zone.members.map((m) => ({ member: m, stat: memberStat(m) }));
      const totalPoints = memberRows.reduce((s, r) => s + r.stat.totalPoints, 0);
      const missionsDone = memberRows.reduce((s, r) => s + r.stat.missionsDone, 0);
      const ticketsUsed = memberRows.reduce((s, r) => s + r.stat.ticketsUsed, 0);
      const memberCount = memberRows.length;
      const completionRate = memberCount && missions ? missionsDone / (memberCount * missions) : 0;
      return {
        zone,
        teamId: team.id,
        memberRows,
        totalPoints,
        missionsDone,
        ticketsUsed,
        memberCount,
        completionRate,
      };
    })
  );

  const teamRows = teams.map((team) => {
    const zones = zoneRows.filter((z) => z.teamId === team.id);
    const totalPoints = zones.reduce((s, z) => s + z.totalPoints, 0);
    const missionsDone = zones.reduce((s, z) => s + z.missionsDone, 0);
    const memberCount = zones.reduce((s, z) => s + z.memberCount, 0);
    const ticketsUsed = zones.reduce((s, z) => s + z.ticketsUsed, 0);
    const completionRate = memberCount && missions ? missionsDone / (memberCount * missions) : 0;
    return { team, zones, totalPoints, missionsDone, memberCount, ticketsUsed, completionRate };
  });

  const orgTotals = {
    totalPoints: teamRows.reduce((s, t) => s + t.totalPoints, 0),
    missionsDone: teamRows.reduce((s, t) => s + t.missionsDone, 0),
    memberCount: teamRows.reduce((s, t) => s + t.memberCount, 0),
    ticketsUsed: teamRows.reduce((s, t) => s + t.ticketsUsed, 0),
    teamCount: teamRows.length,
    zoneCount: zoneRows.length,
    missionCount: missions,
  };

  return { teamRows, orgTotals };
}
