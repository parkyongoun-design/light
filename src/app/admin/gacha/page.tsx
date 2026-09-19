import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPointsPerTicket } from "@/lib/tickets";
import Nav from "@/components/Nav";
import { createGachaItemAction, updatePointsPerTicketAction } from "./actions";
import AdminGachaTest from "./AdminGachaTest";
import GachaItemsEditor from "./GachaItemsEditor";

export default async function AdminGachaPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "ADMIN") redirect("/zone");

  const [items, pointsPerTicket] = await Promise.all([
    prisma.gachaItem.findMany({ orderBy: { rarity: "asc" } }),
    getPointsPerTicket(),
  ]);

  return (
    <>
      <Nav name={member.name} role={member.role} active="admin-gacha" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          가챠 관리
        </h1>

        <AdminGachaTest />

        <form action={updatePointsPerTicketAction} className="card mb-6 flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              뽑기권 전환 기준
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              이 점수를 모으면 뽑기권 1장 (예: 쉬운 미션 10점 기준 10개=1장)
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              name="pointsPerTicket"
              type="number"
              defaultValue={pointsPerTicket}
              className="w-20 rounded-lg border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--baseline)" }}
            />
            <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
              저장
            </button>
          </div>
        </form>

        <form action={createGachaItemAction} className="card mb-6 flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            새 아이템 추가
          </p>
          <div className="flex gap-2">
            <input name="emoji" placeholder="🎁" className="w-16 rounded-lg border px-3 py-2 text-center text-sm" style={{ borderColor: "var(--baseline)" }} />
            <input name="name" placeholder="아이템 이름" required className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }} />
          </div>
          <input name="description" placeholder="설명(선택)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }} />
          <input name="linkUrl" type="url" placeholder="링크(선택, 예: 심리테스트 주소 https://...)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }} />
          <div className="flex gap-2">
            <select name="rarity" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }}>
              <option value="COMMON">일반</option>
              <option value="RARE">희귀</option>
              <option value="EPIC">에픽</option>
              <option value="LEGENDARY">전설</option>
            </select>
            <input name="weight" type="number" defaultValue={20} placeholder="확률 가중치" className="w-28 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }} />
          </div>
          <button type="submit" className="rounded-lg py-2 text-sm font-semibold text-white" style={{ background: "var(--series-1)" }}>
            추가하기
          </button>
        </form>

        <GachaItemsEditor items={items} />
      </main>
    </>
  );
}
