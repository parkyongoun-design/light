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

function PullButton({ disabled, label }: { disabled: boolean; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-2xl py-4 text-base font-bold text-white transition disabled:opacity-40"
      style={{ background: "linear-gradient(135deg, var(--series-1), #8b5cf6)" }}
    >
      {pending ? "뽑는 중..." : label ?? "🎰 뽑기 (1장 사용)"}
    </button>
  );
}

export default function GachaMachine({
  ticketsAvailable,
  unlimited = false,
  canPull = true,
  memberName,
}: {
  ticketsAvailable: number;
  unlimited?: boolean;
  canPull?: boolean;
  memberName: string;
}) {
  const [state, formAction] = useFormState<PullState, FormData>(
    async (prev) => pullGachaAction(prev),
    { result: undefined, error: undefined }
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [boxImgOk, setBoxImgOk] = useState(true);

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
        {unlimited ? "보유 뽑기권" : "우리 조 뽑기권"}
      </p>
      <p className="mb-4 text-4xl font-bold tabular" style={{ color: "var(--text-primary)" }}>
        {unlimited ? "무제한" : `${ticketsAvailable}장`}
      </p>

      <div
        className={`mx-auto mb-4 flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl text-5xl ${shaking ? "animate-gacha-shake" : ""}`}
        style={{ background: boxImgOk ? "transparent" : "var(--page-plane)" }}
      >
        {boxImgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/gacha/gacha-box.png" alt="가챠 상자" className="h-full w-full object-contain" onError={() => setBoxImgOk(false)} />
        ) : (
          "🎁"
        )}
      </div>

      <form action={formAction}>
        <PullButton disabled={!canPull || (!unlimited && ticketsAvailable < 1)} label={canPull ? undefined : "조장만 뽑을 수 있어요"} />
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
            {state.result.linkUrl && (
              <a
                href={state.result.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-xl border py-2 text-sm font-semibold"
                style={{ borderColor: "var(--series-1)", color: "var(--series-1)" }}
              >
                🔗 링크 열기
              </a>
            )}
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/result/${state.result!.shareId}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  window.prompt("이 링크를 복사해서 카톡방에 공유하세요", url);
                }
              }}
              className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--series-3)" }}
            >
              {copied ? "✅ 링크 복사됨!" : "🔗 결과 링크 복사 (카톡 공유용)"}
            </button>
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
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--series-1), #8b5cf6)" }}
            >
              📸 이미지로 저장
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
