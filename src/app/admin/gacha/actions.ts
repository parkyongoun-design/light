"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { weightedPick } from "@/lib/gacha";

export type TestPullState = {
  error?: string;
  result?: { id: string; name: string; rarity: string; emoji: string; description: string };
};

export async function testPullAction(_prev: TestPullState | undefined): Promise<TestPullState> {
  await requireAdmin();

  const items = await prisma.gachaItem.findMany({ where: { active: true } });
  if (items.length === 0) {
    return { error: "활성화된 가챠 아이템이 없습니다." };
  }

  // Test pull only — does not consume tickets or write a GachaPull record.
  const picked = weightedPick(items);
  return {
    result: {
      id: picked.id,
      name: picked.name,
      rarity: picked.rarity,
      emoji: picked.emoji,
      description: picked.description,
    },
  };
}

export async function createGachaItemAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const rarity = String(formData.get("rarity") || "COMMON");
  const weight = Number(formData.get("weight") || 10);
  const emoji = String(formData.get("emoji") || "🎁").trim() || "🎁";
  const description = String(formData.get("description") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  if (!name) return;

  await prisma.gachaItem.create({
    data: { name, rarity: rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY", weight, emoji, description, linkUrl },
  });
  revalidatePath("/admin/gacha");
  revalidatePath("/gacha");
}

export async function updateGachaItemAction(itemId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const rarity = String(formData.get("rarity") || "COMMON");
  const weight = Number(formData.get("weight") || 10);
  const emoji = String(formData.get("emoji") || "🎁").trim() || "🎁";
  const description = String(formData.get("description") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  if (!name) return;

  await prisma.gachaItem.update({
    where: { id: itemId },
    data: { name, rarity: rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY", weight, emoji, description, linkUrl },
  });
  revalidatePath("/admin/gacha");
  revalidatePath("/gacha");
}

export async function updateGachaItemWeightAction(itemId: string, formData: FormData) {
  await requireAdmin();
  const weight = Number(formData.get("weight"));
  if (!Number.isFinite(weight) || weight < 0) return;

  await prisma.gachaItem.update({ where: { id: itemId }, data: { weight } });
  revalidatePath("/admin/gacha");
  revalidatePath("/gacha");
}

export async function toggleGachaItemActiveAction(itemId: string) {
  await requireAdmin();
  const item = await prisma.gachaItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  await prisma.gachaItem.update({ where: { id: itemId }, data: { active: !item.active } });
  revalidatePath("/admin/gacha");
  revalidatePath("/gacha");
}

export async function deleteGachaItemAction(itemId: string) {
  await requireAdmin();
  await prisma.gachaItem.delete({ where: { id: itemId } });
  revalidatePath("/admin/gacha");
  revalidatePath("/gacha");
}

export async function updatePointsPerTicketAction(formData: FormData) {
  await requireAdmin();
  const value = Number(formData.get("pointsPerTicket") || 100);
  if (!value || value < 1) return;
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { pointsPerTicket: value },
    create: { id: "singleton", pointsPerTicket: value },
  });
  revalidatePath("/admin/gacha");
  revalidatePath("/zone");
  revalidatePath("/gacha");
}
