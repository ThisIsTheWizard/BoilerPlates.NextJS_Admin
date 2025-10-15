import { cn } from "@/lib/utils";

type StatusSlice = {
  status: string;
  count: number;
};

const STATUS_COLORS: Record<string, string> = {
  active: "from-emerald-400/80 via-emerald-300/80 to-emerald-500/80",
  inactive: "from-slate-400/80 via-slate-300/80 to-slate-500/80",
  invited: "from-blue-400/80 via-blue-300/80 to-blue-500/80",
  unverified: "from-amber-400/80 via-amber-300/80 to-amber-500/80",
};

type StatusDistributionProps = {
  data: StatusSlice[];
  total: number;
};

export function StatusDistribution({ data, total }: StatusDistributionProps) {
  const safeTotal = total > 0 ? total : data.reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full border border-white/40 bg-white/40 shadow-inner backdrop-blur">
        {data.map((item) => {
          const width =
            safeTotal === 0 ? 0 : Math.max((item.count / safeTotal) * 100, 0);
          return (
            <div
              key={item.status}
              className={cn(
                "h-full bg-gradient-to-r",
                STATUS_COLORS[item.status] ?? "from-slate-300/80 to-slate-400/80",
              )}
              style={{ width: `${width}%` }}
              aria-label={`${item.status} ${Math.round(width)}%`}
            />
          );
        })}
      </div>
      <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        {data.map((item) => {
          const width =
            safeTotal === 0 ? 0 : Math.round((item.count / safeTotal) * 100);
          return (
            <li key={item.status} className="flex items-center justify-between">
              <span className="flex items-center gap-2 capitalize">
                <span
                  className={cn(
                    "inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r",
                    STATUS_COLORS[item.status] ??
                      "from-slate-300/80 to-slate-400/80",
                  )}
                />
                {item.status}
              </span>
              <span className="font-semibold text-slate-700">
                {item.count} <span className="font-normal text-slate-500">({width}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
