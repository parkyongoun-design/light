"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  part: string;
  label: string;
  emoji: string;
  done: number;
  total: number;
  mine: boolean;
};

export default function PartCard({ part, label, emoji, done, total, mine }: Props) {
  const [imgOk, setImgOk] = useState(true);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      href={`/zone/${part.toLowerCase()}`}
      className="card flex flex-col items-center gap-2 p-3 text-center transition active:scale-95"
      style={mine ? { borderColor: "var(--series-1)", borderWidth: 2 } : undefined}
    >
      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/parts/${part.toLowerCase()}.png`} alt={label} className="h-full w-auto object-contain" onError={() => setImgOk(false)} />
        ) : (
          <span className="text-5xl">{emoji}</span>
        )}
      </div>
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {label}
        {mine && (
          <span className="ml-1 text-[10px] font-semibold" style={{ color: "var(--series-1)" }}>
            내 파트
          </span>
        )}
      </p>
      <p className="tabular text-xs" style={{ color: "var(--text-muted)" }}>
        {done}/{total}개 · {pct}%
      </p>
    </Link>
  );
}
