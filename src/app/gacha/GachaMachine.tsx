"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pullGachaAction, type PullState } from "./actions";
import { downloadGachaResultCard } from "@/lib/shareCard";

const RARITY_LABEL: Record<string, string> = {
  COMMON: "일반",
  RARE: "희귀",
  EPIC: "에픽",
  LEGENDARY: "전설",
};

const RARITY_COLOR: Record<string, string> = {
  COMMON: "#9CA3AF",
  RARE: "#3B82F6",
  EPIC: "#A855F7",
  LEGENDARY: "#F59E0B",
};

function PullButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-2xl py-4 text-base font-bold text-white transition disabled:opacity-40"
      style={{ background: "linear-gradient(135deg, var(--series-1), #8b5cf6)" }}
    >
      {pending ? "뽑는 중..." : "🎰 뽑기 (1장 사용)"}
    </button>
  );
}

export default function GachaMachine({
  ticketsAvailable,
  unlimited = false,
  memberName,
}: {
  ticketsAvailable: number;
  unlimited?: boolean;
  memberName: string;
}) {
  const [state, formAction] = useFormState<PullState, FormData>(
    async (prev) => pullGachaAction(prev),
    { result: undefined, error: undefined }
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (state.result) {
      setShaking(true);
      const t = setTimeout(() => {
        setShaking(false);
        setModalOpen(true);
      }, 550);
      return () => clearTimeout(t);
    }
  }, [state.result]);

  return (
    <div className="card p-5 text-center">
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        보유 뽑기권
      </p>
      <p className="mb-4 text-4xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
        {unlimited ? "무제한" : `${ticketsAvailable}장`}
      </p>

      <div className={`mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-2xl text-5xl ${shaking ? "animate-gacha-shake" : ""}`} style={{ background: "var(--page-plane)" }}>
        🎁
      </div>

      <form action={formAction}>
        <PullButton disabled={!unlimited && ticketsAvailable < 1} />
      </form>

      {state.error && (
        <p className="mt-3 text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}

      {modalOpen && state.result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="animate-gacha-pop card w-full max-w-xs p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-wide"
              style={{ color: RARITY_COLOR[state.result.rarity] }}
            >
              {RARITY_LABEL[state.result.rarity]}
            </p>
            <div className="mb-2 text-6xl">{state.result.emoji}</div>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {state.result.name}
            </p>
            {state.result.description && (
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {state.result.description}
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                downloadGachaResultCard({
                  emoji: state.result!.emoji,
                  name: state.result!.name,
                  rarity: state.result!.rarity,
                  description: state.result!.description,
                  memberName,
                })
              }
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--series-1), #8b5cf6)" }}
            >
              📸 카톡 공유용 이미지 저장
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: "var(--page-plane)", color: "var(--text-secondary)" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
