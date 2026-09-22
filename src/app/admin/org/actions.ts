"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function refresh() {
  revalidatePath("/admin/org");
  revalidatePath("/admin");
  revalidatePath("/login");
  revalidatePath("/zone");
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const last = await prisma.team.findFirst({ orderBy: { order: "desc" } });
  await prisma.team.create({ data: { name, order: (last?.order ?? 0) + 1 } });
  refresh();
}

export async function renameTeamAction(teamId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.team.update({ where: { id: teamId }, data: { name } });
  refresh();
}

export async function deleteTeamAction(teamId: string) {
  await requireAdmin();
  await prisma.team.delete({ where: { id: teamId } });
  refresh();
}

export async function createZoneAction(teamId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const last = await prisma.zone.findFirst({ where: { teamId }, orderBy: { order: "desc" } });
  await prisma.zone.create({ data: { name, teamId, order: (last?.order ?? 0) + 1 } });
  refresh();
}

export async function renameZoneAction(zoneId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.zone.update({ where: { id: zoneId }, data: { name } });
  refresh();
}

export async function deleteZoneAction(zoneId: string) {
  await requireAdmin();
  await prisma.zone.delete({ where: { id: zoneId } });
  refresh();
}

export async function createMemberAction(zoneId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const pin = String(formData.get("pin") || "1234").trim() || "1234";
  const isZoneLeader = formData.get("isZoneLeader") === "on";
  const title = String(formData.get("title") || "").trim();
  if (!name) return;
  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.member.create({ data: { name, pinHash, zoneId, isZoneLeader, title, role: "MEMBER" } });
  refresh();
}

export async function updateMemberAction(memberId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const zoneId = String(formData.get("zoneId") || "") || null;
  const isZoneLeader = formData.get("isZoneLeader") === "on";
  const newPin = String(formData.get("newPin") || "").trim();
  const title = String(formData.get("title") || "").trim();
  if (!name) return;

  const data: {
    name: string;
    zoneId: string | null;
    isZoneLeader: boolean;
    title: string;
    pinHash?: string;
  } = { name, zoneId, isZoneLeader, title };

  if (newPin) {
    data.pinHash = await bcrypt.hash(newPin, 10);
  }

  await prisma.member.update({ where: { id: memberId }, data });
  refresh();
}

export async function toggleMemberActiveAction(memberId: string) {
  await requireAdmin();
  const m = await prisma.member.findUnique({ where: { id: memberId } });
  if (!m) return;
  await prisma.member.update({ where: { id: memberId }, data: { active: !m.active } });
  refresh();
}

export async function deleteMemberAction(memberId: string) {
  await requireAdmin();
  await prisma.member.delete({ where: { id: memberId } });
  refresh();
}
