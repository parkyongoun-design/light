"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { getMemberTicketSummary } from "@/lib/tickets";
import { weightedPick } from "@/lib/gacha";

export type PullState = {
  error?: string;
  result?: { id: string; name: string; rarity: string; emoji: string; description: string };
};

export async function pullGachaAction(_prev: PullState | undefined): Promise<PullState> {
  const member = await requireMember();

  if (member.role !== "ADMIN") {
    const summary = await getMemberTicketSummary(member.id);
    if (summary.ticketsAvailable < 1) {
      return { error: "보유한 뽑기권이 없습니다. 미션을 더 완료해주세요!" };
    }
  }

  const items = await prisma.gachaItem.findMany({ where: { active: true } });
  if (items.length === 0) {
    return { error: "등록된 가챠 아이템이 없습니다. 관리자에게 문의하세요." };
  }

  const picked = weightedPick(items);

  await prisma.gachaPull.create({ data: { memberId: member.id, itemId: picked.id } });

  revalidatePath("/gacha");
  revalidatePath("/zone");

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
