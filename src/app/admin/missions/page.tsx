import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/tickets";
import Nav from "@/components/Nav";
import {
  createMissionAction,
  updateMissionAction,
  toggleMissionActiveAction,
  deleteMissionAction,
  updateMissionDeadlineAction,
} from "./actions";

const DIFFICULTY_LABEL: Record<string, string> = { EASY: "쉬움", MEDIUM: "보통", HARD: "어려움" };

function toDatetimeLocalValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function AdminMissionsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "ADMIN") redirect("/zone");

  const [missions, settings] = await Promise.all([
    prisma.mission.findMany({ orderBy: { order: "asc" } }),
    getSettings(),
  ]);

  return (
    <>
      <Nav name={member.name} role={member.role} active="admin-missions" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          미션 관리
        </h1>

        <form action={updateMissionDeadlineAction} className="card mb-6 flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              미션 마감 기한
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              이 시각이 지나면 구역원들이 더 이상 미션을 체크할 수 없습니다. 비워두면 마감 없이 계속 진행됩니다.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              name="missionDeadline"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(settings.missionDeadline)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--baseline)" }}
            />
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--series-1)" }}>
              저장
            </button>
          </div>
        </form>

        <form action={createMissionAction} className="card mb-6 flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            새 미션 추가
          </p>
          <input
            name="title"
            placeholder="미션 이름"
            required
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--baseline)" }}
          />
          <div className="flex gap-2">
            <select name="difficulty" className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }}>
              <option value="EASY">쉬움 (10점)</option>
              <option value="MEDIUM">보통 (20점)</option>
              <option value="HARD">어려움 (30점)</option>
            </select>
            <input
              name="points"
              type="number"
              placeholder="점수(선택)"
              className="w-28 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--baseline)" }}
            />
          </div>
          <button type="submit" className="rounded-lg py-2 text-sm font-semibold text-white" style={{ background: "var(--series-1)" }}>
            추가하기
          </button>
        </form>

        <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
          {missions.map((m) => (
            <details key={m.id} className="px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: m.active ? "var(--text-primary)" : "var(--text-muted)" }}
                  >
                    {m.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {DIFFICULTY_LABEL[m.difficulty]} · {m.points}점 {!m.active && "· 비활성"}
                  </p>
                </div>
              </summary>

              <div className="mt-3 flex flex-col gap-3">
                <form action={updateMissionAction.bind(null, m.id)} className="flex flex-col gap-2">
                  <input
                    name="title"
                    defaultValue={m.title}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    style={{ borderColor: "var(--baseline)" }}
                  />
                  <div className="flex gap-2">
                    <select name="difficulty" defaultValue={m.difficulty} className="flex-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--baseline)" }}>
                      <option value="EASY">쉬움</option>
                      <option value="MEDIUM">보통</option>
                      <option value="HARD">어려움</option>
                    </select>
                    <input
                      name="points"
                      type="number"
                      defaultValue={m.points}
                      className="w-24 rounded-lg border px-3 py-1.5 text-sm"
                      style={{ borderColor: "var(--baseline)" }}
                    />
                  </div>
                  <button type="submit" className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
                    저장
                  </button>
                </form>
                <div className="flex gap-2">
                  <form action={toggleMissionActiveAction.bind(null, m.id)}>
                    <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--baseline)", color: "var(--text-secondary)" }}>
                      {m.active ? "비활성화" : "활성화"}
                    </button>
                  </form>
                  <form action={deleteMissionAction.bind(null, m.id)}>
                    <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))}
          {missions.length === 0 && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              등록된 미션이 없습니다.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
