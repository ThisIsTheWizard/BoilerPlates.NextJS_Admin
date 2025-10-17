"use client";

import { memo, useId, useState } from "react";

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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  const pointCoords = safeData.map((point, index) => {
    const x =
      safeData.length === 1 ? 100 : (index / (safeData.length - 1)) * 100;
    const normalizedY =
      maxValue === 0 ? 100 : 100 - (Math.max(point.value, 0) / maxValue) * 80;
    const y = Math.min(95, Math.max(5, normalizedY));
    return { x, y };
  });

  const svgPoints = pointCoords.map(
    ({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`,
  );

  const areaPoints = ["0,100", ...svgPoints, "100,100"].join(" ");

  const hoveredPoint =
    hoverIndex !== null ? safeData[hoverIndex] ?? null : null;
  const hoveredCoords =
    hoverIndex !== null ? pointCoords[hoverIndex] ?? null : null;

  return (
    <div
      className={cn("relative flex h-48 w-full flex-col gap-3 pb-3", className)}
      onMouseLeave={() => setHoverIndex(null)}
    >
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
          const { x, y } = pointCoords[index];
          return (
            <circle
              key={`${point.label}-${index}`}
              cx={x}
              cy={y}
              r={hoverIndex === index ? 2.6 : 1.8}
              fill="rgba(15,23,42,0.9)"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              tabIndex={0}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex(null)}
            />
          );
        })}
      </svg>
      {hoveredPoint && hoveredCoords ? (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: `${hoveredCoords.x}%`,
              top: `${hoveredCoords.y}%`,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            <div className="rounded-md bg-slate-900/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
              {hoveredPoint.label}: {hoveredPoint.value}
            </div>
            <span className="mt-1 inline-block h-2 w-0.5 rounded-full bg-slate-900/60" />
          </div>
        </div>
      ) : null}
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
