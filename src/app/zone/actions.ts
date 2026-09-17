"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { getSettings } from "@/lib/tickets";

export async function toggleMissionAction(missionId: string) {
  const member = await requireMember();

  if (member.role !== "ADMIN") {
    const settings = await getSettings();
    if (settings.missionDeadline && new Date() > settings.missionDeadline) return;
  }

  const existing = await prisma.missionCompletion.findUnique({
    where: { memberId_missionId: { memberId: member.id, missionId } },
  });

  if (existing) {
    await prisma.missionCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.missionCompletion.create({ data: { memberId: member.id, missionId } });
  }

  revalidatePath("/zone");
  revalidatePath("/gacha");
}
