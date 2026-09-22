"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

type Member = { id: string; name: string };
type Zone = { id: string; name: string; members: Member[] };
type Team = { id: string; name: string; zones: Zone[] };

const ADMIN_TEAM_VALUE = "__admin__";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
      style={{ background: "var(--series-1)" }}
    >
      {pending ? "확인 중..." : "입장하기"}
    </button>
  );
}

const selectStyle = { borderColor: "var(--baseline)" };

export default function LoginForm({ teams, admins }: { teams: Team[]; admins: Member[] }) {
  const [state, formAction] = useFormState(loginAction, undefined);
  const [teamId, setTeamId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [memberId, setMemberId] = useState("");

  const selectedTeam = useMemo(() => teams.find((t) => t.id === teamId), [teams, teamId]);
  const selectedZone = useMemo(() => selectedTeam?.zones.find((z) => z.id === zoneId), [selectedTeam, zoneId]);
  const nameOptions: Member[] = teamId === ADMIN_TEAM_VALUE ? admins : selectedZone?.members ?? [];

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          팀
        </label>
        <select
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            setZoneId("");
            setMemberId("");
          }}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={selectStyle}
        >
          <option value="">팀을 선택하세요</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value={ADMIN_TEAM_VALUE}>관리자</option>
        </select>
      </div>

      {teamId && teamId !== ADMIN_TEAM_VALUE && (
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            조
          </label>
          <select
            value={zoneId}
            onChange={(e) => {
              setZoneId(e.target.value);
              setMemberId("");
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={selectStyle}
          >
            <option value="">조를 선택하세요</option>
            {selectedTeam?.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(teamId === ADMIN_TEAM_VALUE || zoneId) && (
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            이름
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={selectStyle}
          >
            <option value="">이름을 선택하세요</option>
            {nameOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          PIN 번호
        </label>
        <input
          type="password"
          name="pin"
          inputMode="numeric"
          placeholder="••••"
          maxLength={6}
          className="w-full rounded-lg border px-3 py-2 text-sm tracking-widest outline-none"
          style={selectStyle}
        />
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
