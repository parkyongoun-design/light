"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  part: string;
  label: string;
  emoji: string;
  done: number;
  total: number;
};

export default function PartCard({ part, label, emoji, done, total }: Props) {
  const [imgOk, setImgOk] = useState(true);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Link href={`/zone/${part.toLowerCase()}`} className="card flex flex-col items-center gap-2 p-3 text-center transition active:scale-95">
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
      </p>
      <p className="tabular text-xs" style={{ color: "var(--text-muted)" }}>
        {done}/{total}개 · {pct}%
      </p>
    </Link>
  );
}
