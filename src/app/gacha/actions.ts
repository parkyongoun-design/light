"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { getZoneTicketSummary } from "@/lib/tickets";
import { weightedPick } from "@/lib/gacha";

export type PullState = {
  error?: string;
  result?: {
    id: string;
    shareId: string;
    name: string;
    rarity: string;
    emoji: string;
    description: string;
    linkUrl: string;
  };
};

export async function pullGachaAction(_prev: PullState | undefined): Promise<PullState> {
  const member = await requireMember();
  const isAdmin = member.role === "ADMIN";

  if (!isAdmin) {
    if (!member.isZoneLeader || !member.zoneId) {
      return { error: "뽑기는 조장만 할 수 있어요. 조장에게 부탁해보세요!" };
    }
    const summary = await getZoneTicketSummary(member.zoneId);
    if (summary.ticketsAvailable < 1) {
      return { error: "조 뽑기권이 없습니다. 조 점수를 더 모아주세요!" };
    }
  }

  const items = await prisma.gachaItem.findMany({ where: { active: true } });
  if (items.length === 0) {
    return { error: "등록된 가챠 아이템이 없습니다. 관리자에게 문의하세요." };
  }

  const picked = weightedPick(items);
  const pull = await prisma.gachaPull.create({
    data: { memberId: member.id, zoneId: isAdmin ? null : member.zoneId, itemId: picked.id },
  });

  revalidatePath("/gacha");
  revalidatePath("/zone");

  return {
    result: {
      id: picked.id,
      shareId: pull.shareId,
      name: picked.name,
      rarity: picked.rarity,
      emoji: picked.emoji,
      description: picked.description,
      linkUrl: picked.linkUrl,
    },
  };
}
