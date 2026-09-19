"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateDisplaySettingsAction(formData: FormData) {
  await requireAdmin();
  const data = {
    showZoneRanking: formData.get("showZoneRanking") === "on",
    showZoneScores: formData.get("showZoneScores") === "on",
    showHolidayMissions: formData.get("showHolidayMissions") === "on",
  };

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidatePath("/admin");
  revalidatePath("/zone");
}
