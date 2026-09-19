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
  // Demo data only — the real roster replaces this seed data later.
  const f = FAMILY_NAMES[nameCounter % FAMILY_NAMES.length];
  const g = GIVEN_NAMES[Math.floor(nameCounter / FAMILY_NAMES.length) % GIVEN_NAMES.length];
  nameCounter++;
  return `${f}${g}`;
}

type MissionSeed = { part: string; category: string; title: string; hard?: boolean };

// 1 mission = 10 points; hard missions = 20 points.
const MISSIONS: MissionSeed[] = [
  // 직장인
  { part: "WORKER", category: "자격증", title: "수험서/교재 인증 (최근 출제 경향·난이도 변화도 언급)" },
  { part: "WORKER", category: "자격증", title: "공부 사진 (가족·지인에게 진행 상황 공유)" },
  { part: "WORKER", category: "자격증", title: "Q-Net 시험 접수 내역 (시험 일정 보이게)" },
  { part: "WORKER", category: "자격증", title: "응시 결과 공유 (불합격이면 성적표와 재도전 계획)" },
  { part: "WORKER", category: "자격증", title: "자격증 취득 증명서", hard: true },
  { part: "WORKER", category: "야근/업무", title: "회사 PC 화면 (우측 하단 시계 보이게)" },
  { part: "WORKER", category: "야근/업무", title: "설계도·발표자료 등 진행 중인 업무 산출물 공유" },
  { part: "WORKER", category: "동아리/소모임", title: "모임 활동 사진" },
  { part: "WORKER", category: "동아리/소모임", title: "모임용 개인 장비·도구 사진" },
  { part: "WORKER", category: "동아리/소모임", title: "실제 모임 그룹 대화 내역" },
  // 대학생
  { part: "STUDENT", category: "팀플/과제", title: "발표자료 작성 현황 (완성 PPT, 조원 역할분담 진행)" },
  { part: "STUDENT", category: "팀플/과제", title: "조원 모임 사진 (도서관·스터디룸 회의)" },
  { part: "STUDENT", category: "팀플/과제", title: "과제·전공서 공부 사진 (카페·도서관)" },
  { part: "STUDENT", category: "자격증/학업", title: "Q-Net 시험 신청 내역" },
  { part: "STUDENT", category: "자격증/학업", title: "수험서 공부 사진 (정독실·도서관·카페)" },
  { part: "STUDENT", category: "동아리/대외활동", title: "활동 장소·준비물·장비 사진" },
  { part: "STUDENT", category: "동아리/대외활동", title: "동아리원과의 일정·활동 메신저 내역" },
  { part: "STUDENT", category: "봉사/알바/스터디", title: "봉사활동 현장 사진" },
  { part: "STUDENT", category: "봉사/알바/스터디", title: "알바 근무 사진" },
  { part: "STUDENT", category: "봉사/알바/스터디", title: "급여 입금 내역" },
  { part: "STUDENT", category: "봉사/알바/스터디", title: "스터디원 집합 사진·출석" },
  { part: "STUDENT", category: "봉사/알바/스터디", title: "스터디 교재·노트필기 기록" },
  { part: "STUDENT", category: "졸업작품/공모전", title: "졸업작품·공모전 발표자료" },
  { part: "STUDENT", category: "졸업작품/공모전", title: "공모전 신청 포스터·제출 내역", hard: true },
  { part: "STUDENT", category: "졸업작품/공모전", title: "팀원과의 작품 제작·회의 사진" },
  // 휴학생·취준생
  { part: "JOBSEEKER", category: "면접/이력서", title: "서류 합격 통지서·면접 일정 안내 화면", hard: true },
  { part: "JOBSEEKER", category: "면접/이력서", title: "이력서·자기소개서 작성 화면" },
  { part: "JOBSEEKER", category: "면접/이력서", title: "예상 질문 대비 노트" },
  { part: "JOBSEEKER", category: "면접/이력서", title: "면접 복장 착용 사진" },
  { part: "JOBSEEKER", category: "어학원/스터디", title: "토익·어학원 수강 등록 내역" },
  { part: "JOBSEEKER", category: "어학원/스터디", title: "학원 강의실·주변 학습 환경 사진" },
  { part: "JOBSEEKER", category: "어학원/스터디", title: "필기 노트·단어장" },
  { part: "JOBSEEKER", category: "어학원/스터디", title: "교재 학습 달성 기록" },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "공모전 신청 내역·포스터", hard: true },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "팀원과 공모전 준비 현장 사진" },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "Q-Net 접수증" },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "일일 목표 학습 달성 인증" },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "알바 근무 사진" },
  { part: "JOBSEEKER", category: "공모전/자격증/알바", title: "급여 내역" },
  // 명절 (전 구성원 공통)
  { part: "HOLIDAY", category: "집안 돕기", title: "설거지" },
  { part: "HOLIDAY", category: "집안 돕기", title: "식사 준비 돕기" },
  { part: "HOLIDAY", category: "집안 돕기", title: "안마" },
  { part: "HOLIDAY", category: "효도", title: "추석 선물 드리기" },
  { part: "HOLIDAY", category: "효도", title: "부모님께 전화드리기 (본가에 못 가는 경우)" },
  { part: "HOLIDAY", category: "부모님 알아가기", title: "부모님의 버킷리스트 물어보기" },
  { part: "HOLIDAY", category: "부모님 알아가기", title: "가장 기억에 남는 시절 물어보기" },
  { part: "HOLIDAY", category: "부모님 알아가기", title: "부모님 MBTI 물어보기" },
  { part: "HOLIDAY", category: "부모님 알아가기", title: "부모님 장래희망이 뭐였는지 물어보기" },
  { part: "HOLIDAY", category: "함께하기", title: "부모님과 같이 놀러가기", hard: true },
];

// Prizes are conversation starters the whole zone shares. Add real psych-test links via /admin/gacha.
const GACHA_ITEMS = [
  { name: "오늘의 밸런스 게임", rarity: "COMMON", weight: 30, emoji: "⚖️", description: "구역원 각자 A/B 중 하나를 골라 이유를 말해보세요." },
  { name: "요즘 빠져있는 것 말하기", rarity: "COMMON", weight: 30, emoji: "🔥", description: "요즘 푹 빠져 있는 것 하나씩 소개해요." },
  { name: "최근 가장 웃겼던 일", rarity: "COMMON", weight: 25, emoji: "😂", description: "이번 주 가장 웃겼던 순간을 나눠보세요." },
  { name: "인생 영화·드라마 추천 릴레이", rarity: "RARE", weight: 10, emoji: "🎬", description: "한 명씩 인생작을 추천하고 이유를 말해요." },
  { name: "MBTI 궁합 토크", rarity: "RARE", weight: 8, emoji: "🧩", description: "서로의 MBTI를 맞춰보고 잘 맞는 점을 찾아보세요." },
  { name: "함께 하는 심리테스트", rarity: "EPIC", weight: 5, emoji: "🔮", description: "링크의 심리테스트를 다 같이 해보고 결과를 공유해요." },
  { name: "10년 뒤 내 모습 토크", rarity: "EPIC", weight: 4, emoji: "🚀", description: "10년 뒤 어떤 모습이고 싶은지 이야기해요." },
  { name: "인생 명장면 한 가지씩", rarity: "LEGENDARY", weight: 2, emoji: "🌟", description: "지금까지 인생에서 가장 빛났던 순간을 나눠보세요." },
];

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

  await prisma.settings.create({
    data: {
      id: "singleton",
      pointsPerTicket: 100,
      missionDeadline: new Date("2026-09-26T14:59:00.000Z"), // 2026-09-26 23:59 KST
    },
  });

  const defaultPinHash = await bcrypt.hash("1234", 10);
  const adminPinHash = await bcrypt.hash("0000", 10);

  await prisma.member.create({ data: { name: "박용운", pinHash: adminPinHash, role: "ADMIN" } });

  await prisma.mission.createMany({
    data: MISSIONS.map((m, i) => ({
      part: m.part,
      category: m.category,
      title: m.title,
      difficulty: m.hard ? "HARD" : "EASY",
      points: m.hard ? 20 : 10,
      order: i + 1,
    })),
  });
  const missionRows = await prisma.mission.findMany();

  await prisma.gachaItem.createMany({ data: GACHA_ITEMS });

  const parts = ["WORKER", "STUDENT", "JOBSEEKER"];
  let partCounter = 0;

  for (let t = 1; t <= TEAM_COUNT; t++) {
    const team = await prisma.team.create({ data: { name: `${t}팀`, order: t } });
    for (let z = 1; z <= ZONES_PER_TEAM; z++) {
      const zone = await prisma.zone.create({ data: { name: `${t}팀 ${z}구역`, order: z, teamId: team.id } });
      await prisma.member.createMany({
        data: Array.from({ length: MEMBERS_PER_ZONE }, (_, m) => ({
          name: randomName(),
          pinHash: defaultPinHash,
          role: "MEMBER",
          isZoneLeader: m === 0,
          part: parts[partCounter++ % parts.length],
          zoneId: zone.id,
        })),
      });
    }
  }

  const allMembers = await prisma.member.findMany({ where: { role: "MEMBER" } });
  const completionRows: { memberId: string; missionId: string }[] = [];
  for (const member of allMembers) {
    const activity = Math.random();
    for (const mission of missionRows) {
      if (mission.part !== member.part && mission.part !== "HOLIDAY") continue;
      if (Math.random() < 0.15 + activity * 0.6) completionRows.push({ memberId: member.id, missionId: mission.id });
    }
  }
  await prisma.missionCompletion.createMany({ data: completionRows });

  console.log(`Seeded ${TEAM_COUNT} teams, ${allMembers.length} members, ${missionRows.length} missions, ${completionRows.length} completions.`);
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
