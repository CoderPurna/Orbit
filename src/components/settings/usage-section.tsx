"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useUsage } from "@/hooks/use-meetings";
import type { UsageMetric } from "@/lib/api-types";
import { formatUsd } from "@/lib/format";

const METRIC_LABEL: Record<UsageMetric, { label: string; unit: string }> = {
  webrtc_minutes: { label: "Participant minutes", unit: "min" },
  egress_gb: { label: "Media egress", unit: "GB" },
  recording_minutes: { label: "Recording", unit: "min" },
  storage_gb: { label: "Storage", unit: "GB" },
  stt_minutes: { label: "Transcription", unit: "min" },
  ai_input_tokens: { label: "AI input tokens", unit: "tokens" },
  ai_output_tokens: { label: "AI output tokens", unit: "tokens" },
  email_sent: { label: "Emails sent", unit: "emails" },
};

const chartConfig = {
  cost: { label: "Cost (USD)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function UsageSection() {
  const { data, isPending, isError } = useUsage();

  const daily = React.useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, number>();
    for (const r of data.dailyRollups) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(r.totalCostUsd));
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, cost]) => ({
        day: new Date(day).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        cost: Number(cost.toFixed(4)),
      }));
  }, [data]);

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl md:col-span-2" />
        <Skeleton className="h-64 rounded-xl md:col-span-3" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyTitle>Couldn&apos;t load usage</EmptyTitle>
          <EmptyDescription>Try again in a moment.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const metrics = Object.entries(data.usage.metrics) as Array<
    [UsageMetric, { quantity: number; costUsd: number }]
  >;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5" />
            Estimated cost, all time
          </CardDescription>
          <CardTitle className="font-display text-3xl tracking-tight tabular-nums">
            {formatUsd(data.usage.totalCostUsd)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          Metered from webhooks: participant-minutes, egress, recording,
          transcription and AI tokens.
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="border-b">
          <CardTitle className="inline-flex items-center gap-2">
            <Activity className="text-primary size-4" />
            Daily cost
          </CardTitle>
          <CardDescription>
            Platform-wide rollups for the last 30 days with activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No rollups yet. They&apos;re computed hourly.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart
                data={daily}
                margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={11}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader className="border-b">
          <CardTitle>Your metered usage</CardTitle>
          <CardDescription>Attributed to meetings you hosted.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity />
                </EmptyMedia>
                <EmptyTitle>Nothing metered yet</EmptyTitle>
                <EmptyDescription>
                  Host a meeting and the ledger fills in when it ends.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map(([metric, v]) => (
                  <TableRow key={metric}>
                    <TableCell className="font-medium">
                      {METRIC_LABEL[metric]?.label ?? metric}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {v.quantity.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      {METRIC_LABEL[metric]?.unit ?? ""}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatUsd(v.costUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
