"use client";

import { memo, useId } from "react";

import { cn } from "@/lib/utils";

export type MiniAreaPoint = {
  label: string;
  value: number;
};

type MiniAreaChartProps = {
  data: MiniAreaPoint[];
  className?: string;
};

export const MiniAreaChart = memo(function MiniAreaChart({
  data,
  className,
}: MiniAreaChartProps) {
  const gradientId = useId();

  const safeData =
    data.length > 0
      ? data
      : [
          { label: "N/A", value: 0 },
          { label: "N/A", value: 0 },
        ];

  const maxValue = Math.max(
    1,
    ...safeData.map((point) => (Number.isFinite(point.value) ? point.value : 0)),
  );

  const svgPoints = safeData.map((point, index) => {
    const x =
      safeData.length === 1 ? 100 : (index / (safeData.length - 1)) * 100;
    const normalizedY =
      maxValue === 0 ? 100 : 100 - (Math.max(point.value, 0) / maxValue) * 80;
    const y = Math.min(95, Math.max(5, normalizedY));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const areaPoints = ["0,100", ...svgPoints, "100,100"].join(" ");

  return (
    <div className={cn("flex h-48 w-full flex-col gap-3", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible rounded-3xl border border-white/40 bg-white/40 shadow-inner backdrop-blur"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,23,42,0.5)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0)" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#${gradientId})`}
          stroke="none"
          opacity={0.9}
        />
        <polyline
          points={svgPoints.join(" ")}
          fill="none"
          stroke="rgba(15,23,42,0.75)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {safeData.map((point, index) => {
          const [x, y] = svgPoints[index].split(",").map(Number);
          return (
            <circle
              key={`${point.label}-${index}`}
              cx={x}
              cy={y}
              r={1.8}
              fill="rgba(15,23,42,0.9)"
            />
          );
        })}
      </svg>
      <div className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {safeData.map((point) => (
          <span key={point.label} className="flex-1 text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
});
