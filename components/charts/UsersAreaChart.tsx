"use client";

import { AreaChart, Title } from "@tremor/react";

export type SeriesPoint = { date: string; users: number };

export default function UsersAreaChart({
  data,
  title = "New Users Over Time",
}: {
  data: SeriesPoint[];
  title?: string;
}) {
  const valueFormatter = (n: number) => `${n}`;

  return (
    <div>
      <Title>{title}</Title>
      <AreaChart
        className="h-64 mt-4"
        data={data}
        index="date"
        categories={["users"]}
        colors={["blue"]}
        valueFormatter={valueFormatter}
        yAxisWidth={40}
      />
    </div>
  );
}

