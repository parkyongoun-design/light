"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setMissionDoneAction } from "./actions";

type Props = {
  missionId: string;
  title: string;
  points: number;
  hard: boolean;
  initialDone: boolean;
  locked: boolean;
};

export default function MissionRow({ missionId, title, points, hard, initialDone, locked }: Props) {
  const router = useRouter();
  const [done, setDone] = useState(initialDone);
  const [error, setError] = useState(false);
  const seq = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggle() {
    if (locked) return;
    const next = !done;
    const mySeq = ++seq.current;
    setDone(next);
    setError(false);

    setMissionDoneAction(missionId, next)
      .then((res) => {
        if (mySeq !== seq.current) return;
        if (!res.ok) {
          setDone(!next);
          setError(true);
          return;
        }
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => router.refresh(), 600);
      })
      .catch(() => {
        if (mySeq !== seq.current) return;
        setDone(!next);
        setError(true);
      });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p
          className="text-sm font-medium"
          style={{ color: done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}
        >
          {title}
        </p>
        <p className="text-xs" style={{ color: error ? "var(--status-critical)" : "var(--text-muted)" }}>
          {error ? "저장 실패 — 다시 시도해주세요" : `${points}점${hard ? " · 어려움" : ""}`}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={locked}
        className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
        style={done ? { background: "var(--gridline)", color: "var(--text-secondary)" } : { background: "var(--series-1)", color: "#fff" }}
      >
        {locked ? (done ? "완료" : "마감됨") : done ? "완료 취소" : "완료 체크"}
      </button>
    </div>
  );
}
