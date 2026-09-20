"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { getSettings } from "@/lib/tickets";

export async function setMissionDoneAction(missionId: string, done: boolean): Promise<{ ok: boolean }> {
  const member = await requireMember();

  if (member.role !== "ADMIN") {
    const [settings, mission] = await Promise.all([
      getSettings(),
      prisma.mission.findUnique({ where: { id: missionId }, select: { active: true, part: true } }),
    ]);
    if (settings.missionDeadline && new Date() > settings.missionDeadline) return { ok: false };
    const allowed = mission?.active && (mission.part !== "HOLIDAY" || settings.showHolidayMissions);
    if (!allowed) return { ok: false };
  }

  if (done) {
    await prisma.missionCompletion.createMany({ data: [{ memberId: member.id, missionId }], skipDuplicates: true });
  } else {
    await prisma.missionCompletion.deleteMany({ where: { memberId: member.id, missionId } });
  }
  return { ok: true };
}
