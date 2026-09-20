import { prisma } from "./db";

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
}

export async function getPointsPerTicket(): Promise<number> {
  const settings = await getSettings();
  return settings.pointsPerTicket;
}

/** Missions visible to a member: their own part plus the shared holiday set (when enabled). */
export function visibleMissionWhere(part: string, showHoliday: boolean) {
  const parts = showHoliday ? [part, "HOLIDAY"] : [part];
  return { active: true, part: { in: parts } };
}

/** Points are pooled per zone; every `pointsPerTicket` zone points earns one shared draw. */
export async function getZoneTicketSummary(zoneId: string) {
  const [completions, ticketsUsed, pointsPerTicket] = await Promise.all([
    prisma.missionCompletion.findMany({
      where: { member: { zoneId, active: true, role: "MEMBER" }, mission: { active: true } },
      select: { mission: { select: { points: true } } },
    }),
    prisma.gachaPull.count({ where: { zoneId } }),
    getPointsPerTicket(),
  ]);

  const totalPoints = completions.reduce((sum, c) => sum + c.mission.points, 0);
  const ticketsEarned = Math.floor(totalPoints / pointsPerTicket);
  const ticketsAvailable = Math.max(0, ticketsEarned - ticketsUsed);
  const pointsIntoNextTicket = totalPoints % pointsPerTicket;

  return {
    totalPoints,
    pointsPerTicket,
    ticketsEarned,
    ticketsUsed,
    ticketsAvailable,
    pointsIntoNextTicket,
  };
}
