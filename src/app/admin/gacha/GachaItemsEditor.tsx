"use client";

import { useEffect, useState } from "react";
import {
  updateGachaItemAction,
  updateGachaItemWeightAction,
  toggleGachaItemActiveAction,
  deleteGachaItemAction,
} from "./actions";

type Item = {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  weight: number;
  active: boolean;
  description: string;
};

const RARITY_LABEL: Record<string, string> = { COMMON: "일반", RARE: "희귀", EPIC: "에픽", LEGENDARY: "전설" };

export default function GachaItemsEditor({ items }: { items: Item[] }) {
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.weight]))
  );

  useEffect(() => {
    setWeights(Object.fromEntries(items.map((i) => [i.id, i.weight])));
  }, [items]);

  const liveTotal = items.filter((i) => i.active).reduce((sum, i) => sum + (weights[i.id] ?? i.weight), 0);

  if (items.length === 0) {
    return (
      <div className="card">
        <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          등록된 아이템이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card divide-y" style={{ borderColor: "var(--gridline)" }}>
      {items.map((item) => {
        const liveWeight = weights[item.id] ?? item.weight;
        const pct = item.active && liveTotal > 0 ? (liveWeight / liveTotal) * 100 : 0;

        return (
          <div key={item.id} className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: item.active ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {RARITY_LABEL[item.rarity]}
                  {!item.active && " · 비활성"}
                </p>
              </div>
            </div>

            <form
              action={updateGachaItemWeightAction.bind(null, item.id)}
              className="flex items-center gap-2 rounded-lg p-2.5"
              style={{ background: "var(--page-plane)" }}
            >
              <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
                가중치
              </label>
              <input
                name="weight"
                type="number"
                min={0}
                value={liveWeight}
                onChange={(e) => setWeights((prev) => ({ ...prev, [item.id]: Number(e.target.value) || 0 }))}
                className="w-20 rounded-lg border px-2 py-1 text-sm tabular"
                style={{ borderColor: "var(--baseline)" }}
              />
              <span className="text-sm font-semibold tabular" style={{ color: "var(--series-1)" }}>
                확률 {pct.toFixed(1)}%
              </span>
              <button
                type="submit"
                className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: "var(--series-1)" }}
              >
                저장
              </button>
            </form>

            <details className="mt-2">
              <summary className="cursor-pointer text-xs" style={{ color: "var(--text-muted)" }}>
                자세히 수정
              </summary>
              <div className="mt-2 flex flex-col gap-3">
                <form action={updateGachaItemAction.bind(null, item.id)} className="flex flex-col gap-2">
                  <input type="hidden" name="weight" value={liveWeight} />
                  <div className="flex gap-2">
                    <input name="emoji" defaultValue={item.emoji} className="w-16 rounded-lg border px-3 py-1.5 text-center text-sm" style={{ borderColor: "var(--baseline)" }} />
                    <input name="name" defaultValue={item.name} className="flex-1 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--baseline)" }} />
                  </div>
                  <input name="description" defaultValue={item.description} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--baseline)" }} />
                  <select name="rarity" defaultValue={item.rarity} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--baseline)" }}>
                    <option value="COMMON">일반</option>
                    <option value="RARE">희귀</option>
                    <option value="EPIC">에픽</option>
                    <option value="LEGENDARY">전설</option>
                  </select>
                  <button type="submit" className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--series-1)" }}>
                    이름/설명/등급 저장
                  </button>
                </form>

                <div className="flex gap-2">
                  <form action={toggleGachaItemActiveAction.bind(null, item.id)}>
                    <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--baseline)", color: "var(--text-secondary)" }}>
                      {item.active ? "비활성화" : "활성화"}
                    </button>
                  </form>
                  <form action={deleteGachaItemAction.bind(null, item.id)}>
                    <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}
