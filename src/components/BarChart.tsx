type Datum = { label: string; value: number; sublabel?: string };

export default function BarChart({
  data,
  valueFormat = (v: number) => String(v),
  color = "var(--series-1)",
}: {
  data: Datum[];
  valueFormat?: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => {
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        return (
          <div key={d.label} className="group">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {d.label}
                {d.sublabel && (
                  <span className="ml-1.5 font-normal" style={{ color: "var(--text-muted)" }}>
                    {d.sublabel}
                  </span>
                )}
              </span>
              <span className="tabular font-semibold" style={{ color: "var(--text-secondary)" }}>
                {valueFormat(d.value)}
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ background: "var(--gridline)" }}
              title={`${d.label}: ${valueFormat(d.value)}`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
