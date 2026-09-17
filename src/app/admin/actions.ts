"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateShowZoneRankingAction(formData: FormData) {
  await requireAdmin();
  const showZoneRanking = formData.get("showZoneRanking") === "on";

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { showZoneRanking },
    create: { id: "singleton", showZoneRanking },
  });

  revalidatePath("/admin");
  revalidatePath("/zone");
}
