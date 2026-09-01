"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Radio,
  Zap,
  ShieldCheck,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Server,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SFUNode {
  id: string;
  name: string;
  region: "americas" | "europe" | "asia";
  city: string;
  latency: number;
  status: "optimal" | "active";
  load: number;
  x: number; // Percentage on canvas (0-100)
  y: number; // Percentage on canvas (0-100)
  connections: string[]; // Connected Node IDs
}

const sfuNodes: SFUNode[] = [
  {
    id: "us-east",
    name: "N. Virginia (us-east-1)",
    region: "americas",
    city: "Ashburn",
    latency: 14,
    status: "optimal",
    load: 28,
    x: 28,
    y: 38,
    connections: ["us-west", "eu-central", "sa-east"],
  },
  {
    id: "us-west",
    name: "Oregon (us-west-2)",
    region: "americas",
    city: "Portland",
    latency: 22,
    status: "optimal",
    load: 34,
    x: 18,
    y: 32,
    connections: ["us-east", "ap-northeast"],
  },
  {
    id: "eu-central",
    name: "Frankfurt (eu-central-1)",
    region: "europe",
    city: "Frankfurt",
    latency: 38,
    status: "optimal",
    load: 42,
    x: 52,
    y: 30,
    connections: ["us-east", "eu-west", "ap-south"],
  },
  {
    id: "eu-west",
    name: "London (eu-west-1)",
    region: "europe",
    city: "London",
    latency: 32,
    status: "optimal",
    load: 31,
    x: 47,
    y: 26,
    connections: ["eu-central", "us-east"],
  },
  {
    id: "ap-northeast",
    name: "Tokyo (ap-northeast-1)",
    region: "asia",
    city: "Tokyo",
    latency: 68,
    status: "optimal",
    load: 45,
    x: 82,
    y: 36,
    connections: ["us-west", "ap-southeast"],
  },
  {
    id: "ap-southeast",
    name: "Singapore (ap-southeast-1)",
    region: "asia",
    city: "Singapore",
    latency: 74,
    status: "optimal",
    load: 38,
    x: 75,
    y: 62,
    connections: ["ap-northeast", "ap-south"],
  },
  {
    id: "ap-south",
    name: "Mumbai (ap-south-1)",
    region: "asia",
    city: "Mumbai",
    latency: 82,
    status: "optimal",
    load: 29,
    x: 65,
    y: 52,
    connections: ["eu-central", "ap-southeast"],
  },
  {
    id: "sa-east",
    name: "São Paulo (sa-east-1)",
    region: "americas",
    city: "São Paulo",
    latency: 110,
    status: "active",
    load: 22,
    x: 35,
    y: 72,
    connections: ["us-east"],
  },
];

export function TopologyVisualizer() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "americas" | "europe" | "asia">("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("us-east");

  const selectedNode = sfuNodes.find((n) => n.id === selectedNodeId) || sfuNodes[0];

  const filteredNodes = sfuNodes.filter(
    (n) => selectedFilter === "all" || n.region === selectedFilter
  );

  return (
    <div className="w-full rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              Global SFU Mesh Topology
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              45+ Regions Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Click any edge node to inspect zero-loss WebRTC routing latency and hardware load.
          </p>
        </div>

        {/* Region Filter Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-secondary/80 border border-border/60">
          {(["all", "americas", "europe", "asia"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={cn(
                "relative px-3 py-1.5 text-xs font-medium rounded-xl transition-colors duration-150 capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                selectedFilter === filter
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter}
              {selectedFilter === filter && (
                <motion.div
                  layoutId="topology-tab-active"
                  className="absolute inset-0 bg-card rounded-xl border border-border/60 shadow-2xs -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Live Node Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Interactive Topology Canvas (2 Columns) */}
        <div className="lg:col-span-2 relative min-h-[380px] sm:min-h-[420px] rounded-2xl bg-secondary/50 border border-border/70 p-4 overflow-hidden flex flex-col justify-between">
          {/* Subtle Grid Map Background */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {sfuNodes.map((source) =>
              source.connections.map((targetId) => {
                const target = sfuNodes.find((n) => n.id === targetId);
                if (!target || source.id > targetId) return null; // Avoid duplicate lines

                const isHighlighted =
                  source.id === selectedNodeId || targetId === selectedNodeId;

                return (
                  <g key={`${source.id}-${target.id}`}>
                    {/* Line path */}
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="currentColor"
                      strokeWidth={isHighlighted ? "2" : "1"}
                      className={cn(
                        "transition-all duration-300",
                        isHighlighted
                          ? "text-primary opacity-90 stroke-[2]"
                          : "text-border opacity-40"
                      )}
                      strokeDasharray={isHighlighted ? "4 4" : undefined}
                    />
                  </g>
                );
              })
            )}
          </svg>

          {/* Interactive SFU Nodes */}
          <div className="relative z-10 w-full h-full min-h-[340px]">
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className="relative flex items-center justify-center focus:outline-none group active:scale-95"
                  >
                    {/* Pulsing Outer Ring for Selected Node */}
                    {isSelected && (
                      <span className="absolute inline-flex h-10 w-10 rounded-full bg-primary/20 animate-ping" />
                    )}

                    {/* Node Core Button */}
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 shadow-md",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary scale-110 shadow-primary/30"
                          : "bg-card text-foreground border-border hover:border-primary/60 hover:scale-105"
                      )}
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </div>

                    {/* Node Label Tooltip */}
                    <div
                      className={cn(
                        "absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-mono font-medium shadow-sm transition-all duration-200 border pointer-events-none z-20",
                        isSelected
                          ? "bg-foreground text-background border-transparent font-semibold scale-100 opacity-100"
                          : "bg-card/90 text-muted-foreground border-border/80 scale-95 opacity-80 group-hover:opacity-100 group-hover:scale-100"
                      )}
                    >
                      {node.city} ({node.latency}ms)
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Canvas Bottom Legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" /> Active SFU Node
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;50ms Latency
              </span>
            </div>
            <span className="tabular-nums">Cascaded SFU Mesh v2.4</span>
          </div>
        </div>

        {/* Selected Node Details Card (1 Column) */}
        <div className="rounded-2xl bg-secondary/60 border border-border/80 p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                  Selected Edge Region
                </span>
                <h4 className="text-lg font-bold text-foreground mt-0.5">
                  {selectedNode.name}
                </h4>
              </div>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Server className="w-5 h-5" />
              </div>
            </div>

            {/* Metrics List */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70">
                <span className="text-muted-foreground">Glass-to-Glass Latency</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {selectedNode.latency}ms
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70">
                <span className="text-muted-foreground">SFU CPU Load</span>
                <span className="font-bold text-foreground tabular-nums">
                  {selectedNode.load}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70">
                <span className="text-muted-foreground">Security Protocol</span>
                <span className="font-semibold text-shield flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> AES-GCM-256
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70">
                <span className="text-muted-foreground">Active Streams</span>
                <span className="font-bold text-foreground tabular-nums">
                  1,480 / 10,000
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 space-y-2">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xs hover:bg-primary/90 transition-all active:scale-[0.97]"
            >
              <span>Test Edge Ping</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
