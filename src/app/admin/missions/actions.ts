"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isMissionPart } from "@/lib/parts";

const DIFFICULTY_POINTS: Record<string, number> = { EASY: 10, MEDIUM: 15, HARD: 20 };

export async function createMissionAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const difficulty = String(formData.get("difficulty") || "EASY");
  const pointsRaw = formData.get("points");
  const points = pointsRaw ? Number(pointsRaw) : DIFFICULTY_POINTS[difficulty] ?? 10;
  const partRaw = String(formData.get("part") || "");
  const part = isMissionPart(partRaw) ? partRaw : "WORKER";
  const category = String(formData.get("category") || "").trim();
  if (!title) return;

  const last = await prisma.mission.findFirst({ orderBy: { order: "desc" } });
  await prisma.mission.create({
    data: {
      title,
      part,
      category,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      points,
      order: (last?.order ?? 0) + 1,
    },
  });
  revalidatePath("/admin/missions");
  revalidatePath("/zone");
}

export async function updateMissionAction(missionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const difficulty = String(formData.get("difficulty") || "EASY");
  const points = Number(formData.get("points") || 10);
  const partRaw = String(formData.get("part") || "");
  const category = String(formData.get("category") || "").trim();
  if (!title) return;

  await prisma.mission.update({
    where: { id: missionId },
    data: {
      title,
      category,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      points,
      ...(isMissionPart(partRaw) ? { part: partRaw } : {}),
    },
  });
  revalidatePath("/admin/missions");
  revalidatePath("/zone");
}

export async function toggleMissionActiveAction(missionId: string) {
  await requireAdmin();
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return;
  await prisma.mission.update({ where: { id: missionId }, data: { active: !mission.active } });
  revalidatePath("/admin/missions");
  revalidatePath("/zone");
}

export async function deleteMissionAction(missionId: string) {
  await requireAdmin();
  await prisma.mission.delete({ where: { id: missionId } });
  revalidatePath("/admin/missions");
  revalidatePath("/zone");
}

export async function updateMissionDeadlineAction(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("missionDeadline") || "");
  const missionDeadline = raw ? new Date(raw) : null;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { missionDeadline },
    create: { id: "singleton", missionDeadline },
  });
  revalidatePath("/admin/missions");
  revalidatePath("/zone");
}
