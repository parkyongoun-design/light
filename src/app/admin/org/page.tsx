import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Nav from "@/components/Nav";
import { MEMBER_PARTS, PART_LABEL } from "@/lib/parts";
import {
  createTeamAction,
  renameTeamAction,
  deleteTeamAction,
  createZoneAction,
  renameZoneAction,
  deleteZoneAction,
  createMemberAction,
  updateMemberAction,
  toggleMemberActiveAction,
  deleteMemberAction,
} from "./actions";

export default async function AdminOrgPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "ADMIN") redirect("/zone");

  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: {
      zones: {
        orderBy: { order: "asc" },
        include: { members: { orderBy: [{ isZoneLeader: "desc" }, { name: "asc" }] } },
      },
    },
  });

  const allZones = teams.flatMap((t) => t.zones.map((z) => ({ id: z.id, label: `${t.name} · ${z.name}` })));

  return (
    <>
      <Nav name={member.name} role={member.role} active="admin-org" />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          조직 관리
        </h1>
        <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
          팀 → 조 → 조원 순으로 등록하세요. 신규 조원 기본 PIN은 1234입니다.
        </p>

        <form action={createTeamAction} className="card mb-6 flex gap-2 p-4">
          <input name="name" placeholder="새 팀 이름 (예: 7팀)" required className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--baseline)" }} />
          <button type="submit" className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--series-1)" }}>
            팀 추가
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {teams.map((team) => (
            <details key={team.id} className="card p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {team.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {team.zones.length}개 조 · {team.zones.reduce((s, z) => s + z.members.length, 0)}명
                </span>
              </summary>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex gap-2">
                  <form action={renameTeamAction.bind(null, team.id)} className="flex flex-1 gap-2">
                    <input name="name" defaultValue={team.name} className="flex-1 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--baseline)" }} />
                    <button type="submit" className="rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--baseline)" }}>
                      이름 변경
                    </button>
                  </form>
                  <form action={deleteTeamAction.bind(null, team.id)}>
                    <button type="submit" className="rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
                      팀 삭제
                    </button>
                  </form>
                </div>

                <form action={createZoneAction.bind(null, team.id)} className="flex gap-2">
                  <input name="name" placeholder={`새 조 이름 (예: ${team.name} 6조)`} required className="flex-1 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--baseline)" }} />
                  <button type="submit" className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--series-3)" }}>
                    조 추가
                  </button>
                </form>

                {team.zones.map((zone) => (
                  <details key={zone.id} className="rounded-xl border p-3" style={{ borderColor: "var(--gridline)" }}>
                    <summary className="flex cursor-pointer list-none items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {zone.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {zone.members.length}명
                      </span>
                    </summary>

                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <form action={renameZoneAction.bind(null, zone.id)} className="flex flex-1 gap-2">
                          <input name="name" defaultValue={zone.name} className="flex-1 rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }} />
                          <button type="submit" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }}>
                            이름 변경
                          </button>
                        </form>
                        <form action={deleteZoneAction.bind(null, zone.id)}>
                          <button type="submit" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
                            조 삭제
                          </button>
                        </form>
                      </div>

                      <table className="w-full text-left text-xs">
                        <tbody>
                          {zone.members.map((m) => (
                            <tr key={m.id} style={{ borderTop: "1px solid var(--gridline)" }}>
                              <td className="py-2">
                                <details>
                                  <summary className="cursor-pointer list-none">
                                    <span style={{ color: m.active ? "var(--text-primary)" : "var(--text-muted)" }}>{m.name}</span>
                                    <span className="ml-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                                      {PART_LABEL[m.part]}
                                    </span>
                                    {m.isZoneLeader && (
                                      <span className="ml-1 rounded px-1 py-0.5 text-[10px]" style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}>
                                        조장
                                      </span>
                                    )}
                                    {!m.active && <span className="ml-1 text-[10px]" style={{ color: "var(--status-critical)" }}>비활성</span>}
                                  </summary>
                                  <form action={updateMemberAction.bind(null, m.id)} className="mt-2 flex flex-col gap-2 rounded-lg p-2" style={{ background: "var(--page-plane)" }}>
                                    <input name="name" defaultValue={m.name} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }} />
                                    <select name="zoneId" defaultValue={zone.id} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }}>
                                      {allZones.map((z) => (
                                        <option key={z.id} value={z.id}>
                                          {z.label}
                                        </option>
                                      ))}
                                    </select>
                                    <select name="part" defaultValue={m.part} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }}>
                                      {MEMBER_PARTS.map((p) => (
                                        <option key={p} value={p}>
                                          {PART_LABEL[p]}
                                        </option>
                                      ))}
                                    </select>
                                    <input name="newPin" placeholder="새 PIN (변경 시에만 입력)" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }} />
                                    <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                      <input type="checkbox" name="isZoneLeader" defaultChecked={m.isZoneLeader} />
                                      조장으로 지정
                                    </label>
                                    <div className="flex gap-2">
                                      <button type="submit" className="rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
                                        저장
                                      </button>
                                    </div>
                                  </form>
                                  <div className="mt-2 flex gap-2">
                                    <form action={toggleMemberActiveAction.bind(null, m.id)}>
                                      <button type="submit" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)", color: "var(--text-secondary)" }}>
                                        {m.active ? "비활성화" : "활성화"}
                                      </button>
                                    </form>
                                    <form action={deleteMemberAction.bind(null, m.id)}>
                                      <button type="submit" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
                                        삭제
                                      </button>
                                    </form>
                                  </div>
                                </details>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <form action={createMemberAction.bind(null, zone.id)} className="mt-1 flex flex-wrap items-center gap-2 rounded-lg p-2" style={{ background: "var(--page-plane)" }}>
                        <input name="name" placeholder="이름" required className="w-24 rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }} />
                        <select name="part" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }}>
                          {MEMBER_PARTS.map((p) => (
                            <option key={p} value={p}>
                              {PART_LABEL[p]}
                            </option>
                          ))}
                        </select>
                        <input name="pin" placeholder="PIN(기본 1234)" className="w-28 rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--baseline)" }} />
                        <label className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <input type="checkbox" name="isZoneLeader" />
                          조장
                        </label>
                        <button type="submit" className="rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
                          조원 추가
                        </button>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
          {teams.length === 0 && (
            <p className="card px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              등록된 팀이 없습니다. 위에서 팀을 먼저 추가하세요.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
