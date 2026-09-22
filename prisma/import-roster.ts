import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Imports the real team/zone/member org chart from prisma/roster.tsv (팀\t조\t이름\t직책).
// Missions, gacha items, and settings are left untouched — only Team/Zone/Member are replaced.
// The existing admin account (박용운) is kept as-is and skipped here to avoid a duplicate.

type Row = { team: string; zone: string; name: string; title: string };

function loadRoster(): Row[] {
  const raw = readFileSync(join(__dirname, "roster.tsv"), "utf-8");
  const lines = raw.split("\n").map((l) => l.replace(/\r$/, ""));
  const rows: Row[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [team, zone, name, title = ""] = line.split("\t");
    if (!team?.trim() || !zone?.trim() || !name?.trim()) continue;
    rows.push({ team: team.trim(), zone: zone.trim(), name: name.trim(), title: title.trim() });
  }
  return rows;
}

async function main() {
  const rows = loadRoster().filter((r) => r.name !== "박용운"); // already the admin account
  console.log(`Loaded ${rows.length} roster rows (admin's own row skipped).`);

  console.log("Clearing existing non-admin org data...");
  await prisma.gachaPull.deleteMany({ where: { member: { role: "MEMBER" } } });
  await prisma.missionCompletion.deleteMany({ where: { member: { role: "MEMBER" } } });
  await prisma.member.deleteMany({ where: { role: "MEMBER" } });
  await prisma.zone.deleteMany();
  await prisma.team.deleteMany();

  const teamNumbers = [...new Set(rows.map((r) => r.team))].sort((a, b) => Number(a) - Number(b));
  const teamIds = new Map<string, string>();
  for (const t of teamNumbers) {
    const team = await prisma.team.create({ data: { name: `${t}팀`, order: Number(t) } });
    teamIds.set(t, team.id);
  }

  const zoneIds = new Map<string, string>(); // key: `${team}-${zone}`
  for (const t of teamNumbers) {
    const zoneNumbers = [...new Set(rows.filter((r) => r.team === t).map((r) => r.zone))].sort(
      (a, b) => Number(a) - Number(b)
    );
    for (const z of zoneNumbers) {
      const zone = await prisma.zone.create({
        data: { name: `${t}팀 ${z}조`, order: Number(z), teamId: teamIds.get(t)! },
      });
      zoneIds.set(`${t}-${z}`, zone.id);
    }
  }

  const pinHash = await bcrypt.hash("1234", 10);
  await prisma.member.createMany({
    data: rows.map((r) => ({
      name: r.name,
      pinHash,
      role: "MEMBER",
      isZoneLeader: r.title === "조장",
      title: r.title,
      zoneId: zoneIds.get(`${r.team}-${r.zone}`)!,
    })),
  });

  console.log(`Created ${teamNumbers.length} teams, ${zoneIds.size} zones, ${rows.length} members.`);
  console.log("Default PIN for all imported members: 1234");

  const noLeader: string[] = [];
  for (const [key, zoneId] of zoneIds) {
    const hasLeader = await prisma.member.findFirst({ where: { zoneId, isZoneLeader: true } });
    if (!hasLeader) noLeader.push(key);
  }
  if (noLeader.length) {
    console.log("⚠️  Zones with no 조장 (nobody can pull gacha there until one is set):", noLeader.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
