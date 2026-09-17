"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { testPullAction, type TestPullState } from "./actions";

const RARITY_LABEL: Record<string, string> = { COMMON: "일반", RARE: "희귀", EPIC: "에픽", LEGENDARY: "전설" };
const RARITY_COLOR: Record<string, string> = {
  COMMON: "#9CA3AF",
  RARE: "#3B82F6",
  EPIC: "#A855F7",
  LEGENDARY: "#F59E0B",
};

function PullButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, var(--series-1), #8b5cf6)" }}
    >
      {pending ? "뽑는 중..." : "🎰 테스트 뽑기"}
    </button>
  );
}

export default function AdminGachaTest() {
  const [state, formAction] = useFormState<TestPullState, FormData>(async (prev) => testPullAction(prev), {});
  const [modalOpen, setModalOpen] = useState(false);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (state.result) {
      setModalOpen(true);
      setCount((c) => c + 1);
      setTally((prev) => ({ ...prev, [state.result!.name]: (prev[state.result!.name] ?? 0) + 1 }));
    }
  }, [state.result]);

  const tallyRows = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card mb-6 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            뽑기 테스트
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            뽑기권을 소모하지 않고 확률을 미리 확인해볼 수 있어요. 기록에 남지 않습니다.
          </p>
        </div>
        <form action={formAction}>
          <PullButton />
        </form>
      </div>

      {count > 0 && (
        <div className="rounded-lg p-3 text-xs" style={{ background: "var(--page-plane)" }}>
          <p className="mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
            이번 테스트 결과 (총 {count}회)
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {tallyRows.map(([name, n]) => (
              <span key={name} style={{ color: "var(--text-primary)" }}>
                {name} <span className="tabular" style={{ color: "var(--text-muted)" }}>x{n} ({((n / count) * 100).toFixed(1)}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <p className="mt-2 text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      {modalOpen && state.result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setModalOpen(false)}
        >
          <div className="animate-gacha-pop card w-full max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: RARITY_COLOR[state.result.rarity] }}>
              {RARITY_LABEL[state.result.rarity]}
            </p>
            <div className="mb-2 text-6xl">{state.result.emoji}</div>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {state.result.name}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--series-1)" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
