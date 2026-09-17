import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAM_COUNT = 6;
const ZONES_PER_TEAM = 5;
const MEMBERS_PER_ZONE = 10; // includes zone leader

const FAMILY_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const GIVEN_NAMES = [
  "민준", "서연", "도윤", "하은", "시우", "지호", "수아", "예은", "지훈", "다은",
  "우진", "서윤", "건우", "채원", "현우", "지우", "준서", "유진", "동현", "소율",
];

let nameCounter = 0;
function randomName(): string {
  // Demo data only — duplicate display names are fine here since the real
  // roster (provided later) will replace this seed data entirely.
  const f = FAMILY_NAMES[nameCounter % FAMILY_NAMES.length];
  const g = GIVEN_NAMES[Math.floor(nameCounter / FAMILY_NAMES.length) % GIVEN_NAMES.length];
  nameCounter++;
  return `${f}${g}`;
}

async function main() {
  console.log("Seeding...");

  await prisma.gachaPull.deleteMany();
  await prisma.missionCompletion.deleteMany();
  await prisma.gachaItem.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.member.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.team.deleteMany();
  await prisma.settings.deleteMany();

  await prisma.settings.create({ data: { id: "singleton", pointsPerTicket: 100 } });

  const defaultPinHash = await bcrypt.hash("1234", 10);
  const adminPinHash = await bcrypt.hash("0000", 10);

  await prisma.member.create({
    data: {
      name: "박용운",
      pinHash: adminPinHash,
      role: "ADMIN",
    },
  });

  const missions = [
    { title: "새벽예배 1회 참석", difficulty: "EASY", points: 10, order: 1 },
    { title: "말씀 묵상 노트 작성", difficulty: "EASY", points: 10, order: 2 },
    { title: "구역원에게 안부 연락하기", difficulty: "EASY", points: 10, order: 3 },
    { title: "주보 소식 SNS 공유", difficulty: "EASY", points: 10, order: 4 },
    { title: "성경 5장 통독", difficulty: "MEDIUM", points: 20, order: 5 },
    { title: "구역예배 참석", difficulty: "MEDIUM", points: 20, order: 6 },
    { title: "새가족 초청하기", difficulty: "MEDIUM", points: 20, order: 7 },
    { title: "봉사활동 1회 참여", difficulty: "MEDIUM", points: 20, order: 8 },
    { title: "한 주간 매일 기도일기 작성", difficulty: "HARD", points: 30, order: 9 },
    { title: "성경 한 권 완독", difficulty: "HARD", points: 30, order: 10 },
    { title: "전도 대상자와 만남 갖기", difficulty: "HARD", points: 30, order: 11 },
    { title: "구역 리더 세미나 수료", difficulty: "HARD", points: 30, order: 12 },
  ] as const;

  await prisma.mission.createMany({
    data: missions.map((m) => ({ ...m })),
  });
  const missionRows = await prisma.mission.findMany();

  await prisma.gachaItem.createMany({
    data: [
      { name: "감사 스티커", rarity: "COMMON", weight: 45, emoji: "⭐" },
      { name: "믹스커피 세트", rarity: "COMMON", weight: 35, emoji: "☕" },
      { name: "카페 기프티콘", rarity: "RARE", weight: 12, emoji: "🎟️" },
      { name: "문화상품권 1만원", rarity: "RARE", weight: 8, emoji: "🎫" },
      { name: "무선이어폰", rarity: "EPIC", weight: 4, emoji: "🎧" },
      { name: "치킨 기프티콘", rarity: "EPIC", weight: 6, emoji: "🍗" },
      { name: "구역장 추천 도서 세트", rarity: "EPIC", weight: 5, emoji: "📚" },
      { name: "5만원 상당 상품권", rarity: "LEGENDARY", weight: 1, emoji: "💎" },
      { name: "깜짝 특별 선물", rarity: "LEGENDARY", weight: 1, emoji: "🏆" },
    ],
  });

  let teamCounter = 0;

  for (let t = 1; t <= TEAM_COUNT; t++) {
    const team = await prisma.team.create({
      data: { name: `${t}팀`, order: t },
    });
    teamCounter++;

    for (let z = 1; z <= ZONES_PER_TEAM; z++) {
      const zone = await prisma.zone.create({
        data: { name: `${t}팀 ${z}구역`, order: z, teamId: team.id },
      });

      const memberData = [];
      for (let m = 1; m <= MEMBERS_PER_ZONE; m++) {
        memberData.push({
          name: randomName(),
          pinHash: defaultPinHash,
          role: "MEMBER" as const,
          isZoneLeader: m === 1,
          zoneId: zone.id,
        });
      }
      await prisma.member.createMany({ data: memberData });
    }
  }

  // Sprinkle some realistic mission-completion activity so dashboards have data to show.
  const allMembers = await prisma.member.findMany({ where: { role: { not: "ADMIN" } } });
  const completionRows: { memberId: string; missionId: string }[] = [];

  for (const member of allMembers) {
    const activity = Math.random(); // some members more active than others
    for (const mission of missionRows) {
      const roll = Math.random();
      const threshold = mission.difficulty === "EASY" ? 0.75 : mission.difficulty === "MEDIUM" ? 0.5 : 0.3;
      if (roll < threshold * (0.4 + activity)) {
        completionRows.push({ memberId: member.id, missionId: mission.id });
      }
    }
  }

  await prisma.missionCompletion.createMany({ data: completionRows });

  console.log(`Seeded ${teamCounter} teams, ${allMembers.length} members, ${completionRows.length} completions.`);
  console.log("Login PINs — all demo members: 1234, 박용운(관리자): 0000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
