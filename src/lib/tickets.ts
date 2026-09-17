import { prisma } from "./db";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function getPointsPerTicket(): Promise<number> {
  const settings = await getSettings();
  return settings.pointsPerTicket;
}

export async function getMemberTicketSummary(memberId: string) {
  const [totalPoints, ticketsUsed, pointsPerTicket] = await Promise.all([
    prisma.missionCompletion
      .findMany({
        where: { memberId },
        include: { mission: true },
      })
      .then((rows) => rows.reduce((sum, r) => sum + r.mission.points, 0)),
    prisma.gachaPull.count({ where: { memberId } }),
    getPointsPerTicket(),
  ]);

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
