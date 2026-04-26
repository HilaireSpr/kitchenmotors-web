"use client";

import { useMemo, useState } from "react";
import { colors } from "@/styles/colors";

export type PlannerRow = {
  "Planning ID"?: string | null;
  "Recept ID"?: number | null;
  "Handeling ID"?: number | null;
  Recept?: string | null;
  Taak?: string | null;
  Post?: string | null;
  Toestel?: string | null;
  Werkdag_iso?: string | null;
  Start?: string | null;
  Einde?: string | null;
  "Actieve tijd"?: number | null;
  "Passieve tijd"?: number | null;
  "Totale duur"?: number | null;
  "Toestel conflict"?: boolean | null;
  Locked?: boolean | null;
  "Is vaste taak"?: boolean | null;
};

type PlanningOverride = {
  planningId: string;
  receptId?: number | null;
  handelingId?: number | null;
  werkdagIso?: string | null;
  locked: boolean;
  post?: string | null;
  toestel?: string | null;
  start?: string | null;
  end?: string | null;
};

type PlannerGanttProps = {
  rows: PlannerRow[];
  selectedPlanningId?: string | null;
  onSelectPlanningId?: (planningId: string | null) => void;
  groupBy?: "post" | "toestel";
  overrides?: PlanningOverride[];
  onMoveTaskToPost?: (planningId: string, targetPost: string) => void;
  onMoveTaskToDay?: (planningId: string, targetWerkdagIso: string) => void;
  onMoveTaskAfterTask?: (planningId: string, targetPlanningId: string) => void;
  postColors?: Record<string, string>;
};

type GanttTask = {
  planningId: string;
  receptId?: number | null;
  handelingId?: number | null;
  recipeLabel: string;
  label: string;
  post: string;
  toestel: string | null;
  werkdagIso: string;
  start: Date;
  end: Date;
  hasConflict: boolean;
  isBreak: boolean;
  isFixed: boolean;
  isLocked: boolean;
  activeMinutes: number;
  passiveMinutes: number;
};

type CapacityStatus = "ok" | "warning" | "full";

type HoveredCapacity = {
  label: string;
  usedMinutes: number;
  availableMinutes: number;
  taskCount: number;
  biggestTasks: Array<{
    label: string;
    minutes: number;
  }>;
  x: number;
  y: number;
};

type HoveredTask = {
  task: GanttTask;
  isOverridden: boolean;
  x: number;
  y: number;
};

const SIDEBAR_WIDTH = 236;
const LANE_HEIGHT = 52;
const BAR_HEIGHT = 44;
const PX_PER_HOUR = 96;
const CAPACITY_PER_POST = 450;
const STEPPED_LAYOUT = true;

function getNumber(value: number | null | undefined) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isBreakRow(row: PlannerRow) {
  return row.Taak === "🕒 Pauze";
}

function normalizeRows(rows: PlannerRow[]): GanttTask[] {
  return rows
    .map((row, index) => {
      const start = parseDate(row.Start);
      const end = parseDate(row.Einde);

      if (!start || !end) return null;

      const planningId =
        row["Planning ID"] ?? `row-${index}-${row.Post ?? "post"}-${row.Start ?? "start"}`;

      return {
        planningId,
        receptId: row["Recept ID"] ?? null,
        handelingId: row["Handeling ID"] ?? null,
        recipeLabel: row.Recept || "",
        label: row.Taak || row.Recept || "Onbekende taak",
        post: row.Post || "Onbekende post",
        toestel: row.Toestel || null,
        werkdagIso: row.Werkdag_iso || start.toISOString().slice(0, 10),
        start,
        end,
        hasConflict: row["Toestel conflict"] === true,
        isBreak: isBreakRow(row),
        isFixed: row["Is vaste taak"] === true,
        isLocked: row.Locked === true,
        activeMinutes: getNumber(row["Actieve tijd"]),
        passiveMinutes: getNumber(row["Passieve tijd"]),
      };
    })
    .filter((task): task is GanttTask => Boolean(task));
}

function startOfHour(date: Date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function endOfHour(date: Date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(isoDay: string) {
  const date = new Date(`${isoDay}T00:00:00`);
  return date.toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes < 0) return "0 min";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}u`;
  return `${h}u ${m}m`;
}

function overlaps(a: GanttTask, b: GanttTask) {
  return a.start < b.end && b.start < a.end;
}

function assignLanes(tasks: GanttTask[]) {
  const lanes: GanttTask[][] = [];

  for (const task of tasks) {
    let placed = false;

    for (const lane of lanes) {
      const hasOverlap = lane.some((existing) => overlaps(existing, task));
      if (!hasOverlap) {
        lane.push(task);
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.push([task]);
    }
  }

  return lanes;
}

function rowHeightForLaneCount(laneCount: number) {
  return Math.max(1, laneCount) * LANE_HEIGHT;
}

function getTaskDurationMinutes(task: GanttTask) {
  return Math.max(0, (task.end.getTime() - task.start.getTime()) / 60000);
}

function getBiggestTasks(tasks: GanttTask[], limit = 3) {
  return [...tasks]
    .map((task) => ({
      label: task.label,
      minutes: getTaskDurationMinutes(task),
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit);
}

function getCapacityStatus(used: number, available: number): CapacityStatus {
  if (!available || available <= 0) return "ok";

  const ratio = used / available;

  if (ratio >= 1) return "full";
  if (ratio >= 0.85) return "warning";
  return "ok";
}

function getCapacityRatio(used: number, available: number): number {
  if (!available || available <= 0) return 0;
  return Math.min((used / available) * 100, 100);
}

function getCapacityRowBackground(status: CapacityStatus) {
  if (status === "full") return "rgba(220, 38, 38, 0.05)";
  if (status === "warning") return "rgba(245, 158, 11, 0.05)";
  return colors.bg;
}

function getTaskCapacityBorderColor(status: CapacityStatus) {
  if (status === "full") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return null;
}

function lightenHex(hex: string, amount = 0.72) {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) {
    return colors.bgMuted;
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  const mix = (value: number) => Math.round(value + (255 - value) * amount);

  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function getPostColor(post: string, postColors: Record<string, string>) {
  return postColors[post] || colors.taskBg;
}

function getTaskActiveColor(
  task: GanttTask,
  isSelected: boolean,
  isOverridden: boolean,
  postColors: Record<string, string>
) {
  if (isSelected) return colors.selectedBg;
  if (task.isLocked) return colors.lockedBg;
  if (isOverridden) return colors.overrideBg;
  if (task.isFixed) return colors.fixedBg;
  if (task.hasConflict) return colors.conflictBg;
  if (task.isBreak) return colors.breakBg;
  return getPostColor(task.post, postColors);
}

function getTaskPassiveColor(
  task: GanttTask,
  isSelected: boolean,
  isOverridden: boolean,
  postColors: Record<string, string>
) {
  const activeColor = getTaskActiveColor(task, isSelected, isOverridden, postColors);

  if (task.isBreak) return colors.breakBg;
  if (task.hasConflict) return "#fff5f5";
  if (task.isLocked || isOverridden) return colors.overrideBg;

  return lightenHex(activeColor, 0.72);
}

function getTaskBorder(
  task: GanttTask,
  isSelected: boolean,
  isOverridden: boolean,
  capacityStatus: CapacityStatus
) {
  if (isSelected) return `2px solid ${colors.selectedBorder}`;
  if (task.isLocked) return `2px solid ${colors.lockedBorder}`;
  if (isOverridden) return "2px solid #f2c46d";
  if (task.hasConflict) return "1px solid #ef9a9a";
  if (task.isBreak) return "1px solid #d6d6d6";

  const capacityBorder = getTaskCapacityBorderColor(capacityStatus);
  if (capacityBorder) {
    return `1.5px solid ${capacityBorder}`;
  }

  return "1px solid rgba(30, 64, 175, 0.22)";
}

function getTaskTextColor(task: GanttTask, isOverridden: boolean) {
  if (task.isLocked) return "#9a6700";
  if (isOverridden) return "#9a6700";
  if (task.hasConflict) return "#9f1d1d";
  if (task.isBreak) return "#555";
  return "#1f2937";
}

function getTooltipLeft(x: number, width: number) {
  if (typeof window === "undefined") return x;
  return Math.min(x + 40, window.innerWidth - width);
}

function getTooltipTop(y: number, height: number) {
  if (typeof window === "undefined") return y;
  return Math.min(y + 28, window.innerHeight - height);
}

export default function PlannerGantt({
  rows,
  selectedPlanningId = null,
  onSelectPlanningId,
  groupBy = "post",
  overrides = [],
  onMoveTaskToPost,
  onMoveTaskToDay,
  onMoveTaskAfterTask,
  postColors = {},
}: PlannerGanttProps) {
  const tasks = useMemo(() => normalizeRows(rows), [rows]);

  const workdays = useMemo(() => {
    const unique = Array.from(new Set(tasks.map((t) => t.werkdagIso).filter(Boolean)));
    return unique.sort();
  }, [tasks]);

  const [hoveredTask, setHoveredTask] = useState<HoveredTask | null>(null);
  const [hoveredCapacity, setHoveredCapacity] = useState<HoveredCapacity | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPost, setDragOverPost] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, GanttTask[]>();

    for (const task of tasks) {
      const groupKey = groupBy === "toestel" ? task.toestel || "Geen toestel" : task.post;

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }

      map.get(groupKey)!.push(task);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, groupTasks]) => {
        const sorted = [...groupTasks].sort(
          (a, b) => a.start.getTime() - b.start.getTime()
        );

        const lanes = STEPPED_LAYOUT ? sorted.map((task) => [task]) : assignLanes(sorted);

        return {
          label,
          lanes,
        };
      });
  }, [tasks, groupBy]);

  const bounds = useMemo(() => {
    if (!tasks.length) return null;

    const minStart = new Date(Math.min(...tasks.map((t) => t.start.getTime())));
    const maxEnd = new Date(Math.max(...tasks.map((t) => t.end.getTime())));

    return {
      start: startOfHour(minStart),
      end: endOfHour(maxEnd),
    };
  }, [tasks]);

  const hourTicks = useMemo(() => {
    if (!bounds) return [];

    const ticks: Date[] = [];
    const current = new Date(bounds.start);

    while (current < bounds.end) {
      ticks.push(new Date(current));
      current.setHours(current.getHours() + 1);
    }

    return ticks;
  }, [bounds]);

  const timelineWidth = useMemo(() => {
    if (!bounds) return 0;

    const hours = (bounds.end.getTime() - bounds.start.getTime()) / (1000 * 60 * 60);
    return hours * PX_PER_HOUR;
  }, [bounds]);

  if (!tasks.length || !bounds) {
    return (
      <div
        style={{
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          borderRadius: 20,
          padding: 18,
          boxShadow: "0 10px 30px rgba(17,17,17,0.04)",
        }}
      >
        Geen taken om in Gantt te tonen.
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 10px 30px rgba(17,17,17,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: colors.text,
            }}
          >
            Gantt-weergave
          </h3>
          <p
            style={{
              margin: "8px 0 0 0",
              color: colors.textMuted,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Planning op tijdslijn per {groupBy === "toestel" ? "toestel" : "post"}.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            background: colors.bgMuted,
            border: `1px solid ${colors.border}`,
            fontSize: 12,
            fontWeight: 700,
            color: colors.textMuted,
          }}
        >
          {tasks.length} taken
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${colors.border}`,
          borderRadius: 18,
          background: colors.bg,
        }}
      >
        <div style={{ width: SIDEBAR_WIDTH + timelineWidth }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${SIDEBAR_WIDTH}px ${timelineWidth}px`,
              borderBottom: `1px solid ${colors.border}`,
              background: colors.bgMuted,
              minHeight: 68,
            }}
          >
            <div
              style={{
                padding: 14,
                borderRight: `1px solid ${colors.border}`,
                fontSize: 12,
                fontWeight: 700,
                color: colors.textMuted,
                display: "flex",
                alignItems: "center",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {groupBy === "toestel" ? "Toestel" : "Post"}
            </div>

            <div style={{ position: "relative", height: 68 }}>
              {workdays.map((day) => {
                const dayStart = new Date(`${day}T00:00:00`);
                const nextDayStart = new Date(dayStart);
                nextDayStart.setDate(nextDayStart.getDate() + 1);

                const left =
                  ((dayStart.getTime() - bounds.start.getTime()) / (1000 * 60 * 60)) *
                  PX_PER_HOUR;

                const width =
                  ((nextDayStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60)) *
                  PX_PER_HOUR;

                const dayTasks = tasks.filter((task) => task.werkdagIso === day);

                return (
                  <div
                    key={`day-header-${day}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverDay !== day) {
                        setDragOverDay(day);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverDay === day) {
                        setDragOverDay(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();

                      const planningId = e.dataTransfer.getData("text/planningId");
                      if (!planningId) return;

                      onMoveTaskToDay?.(planningId, day);
                      setDragOverDay(null);
                      setDragOverPost(null);
                    }}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      width,
                      height: "100%",
                      background:
                        dragOverDay === day ? "rgba(255, 192, 0, 0.10)" : "transparent",
                      outline:
                        dragOverDay === day ? `2px dashed ${colors.primary}` : "none",
                      outlineOffset: -2,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 10,
                        zIndex: 2,
                        padding: "6px 10px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.92)",
                        border: `1px solid ${colors.border}`,
                        boxShadow: "0 4px 12px rgba(17,17,17,0.04)",
                        fontSize: 11,
                        color: colors.textMuted,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: colors.text }}>
                        {formatDayLabel(day)}
                      </div>
                      <div>{dayTasks.length} taken</div>
                    </div>
                  </div>
                );
              })}

              {hourTicks.map((tick) => {
                const left =
                  ((tick.getTime() - bounds.start.getTime()) / (1000 * 60 * 60)) *
                  PX_PER_HOUR;

                return (
                  <div
                    key={tick.toISOString()}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      height: "100%",
                      borderLeft: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        padding: "42px 8px 8px 8px",
                        fontSize: 11,
                        color: colors.textMuted,
                      }}
                    >
                      {formatTime(tick)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {grouped.map((group) => {
            const rowHeight = rowHeightForLaneCount(group.lanes.length);
            const groupTasks = group.lanes.flat();
            const postColor = getPostColor(group.label, postColors);

            const usedMinutes =
              groupBy === "post"
                ? groupTasks.reduce((sum, task) => sum + getTaskDurationMinutes(task), 0)
                : 0;

            const availableMinutes = CAPACITY_PER_POST;
            const capacityStatus =
              groupBy === "post" ? getCapacityStatus(usedMinutes, availableMinutes) : "ok";

            const rowBackground =
              dragOverPost === group.label
                ? "#eef6ff"
                : groupBy === "post"
                ? getCapacityRowBackground(capacityStatus)
                : colors.bg;

            const ratio = getCapacityRatio(usedMinutes, availableMinutes);

            return (
              <div
                key={group.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${SIDEBAR_WIDTH}px ${timelineWidth}px`,
                  minHeight: rowHeight,
                  borderBottom: "1px solid #f3f3f3",
                }}
              >
                <div
                  style={{
                    padding: 14,
                    borderRight: `1px solid ${colors.border}`,
                    background: "#fcfcfc",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: postColor,
                            border: `1px solid ${colors.border}`,
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: colors.text,
                            lineHeight: 1.2,
                          }}
                        >
                          {group.label}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                        }}
                      >
                        {groupTasks.length} taken
                      </div>
                    </div>

                    {groupBy === "post" ? (
                      <div
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();

                          setHoveredCapacity({
                            label: group.label,
                            usedMinutes: Math.round(usedMinutes),
                            availableMinutes,
                            taskCount: groupTasks.length,
                            biggestTasks: getBiggestTasks(groupTasks, 3),
                            x: rect.left,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => {
                          setHoveredCapacity(null);
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          padding: 10,
                          borderRadius: 12,
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          cursor: "default",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: colors.textMuted,
                              textTransform: "uppercase",
                              letterSpacing: 0.3,
                            }}
                          >
                            Capaciteit
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 999,
                              background:
                                capacityStatus === "full"
                                  ? "rgba(239,68,68,0.15)"
                                  : capacityStatus === "warning"
                                  ? "rgba(245,158,11,0.15)"
                                  : "rgba(34,197,94,0.15)",
                              color:
                                capacityStatus === "full"
                                  ? "#dc2626"
                                  : capacityStatus === "warning"
                                  ? "#d97706"
                                  : "#16a34a",
                              fontWeight: 800,
                            }}
                          >
                            {capacityStatus === "full"
                              ? "Vol"
                              : capacityStatus === "warning"
                              ? "Bijna vol"
                              : "OK"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            fontSize: 12,
                            color: colors.text,
                          }}
                        >
                          <span>{formatMinutes(Math.round(usedMinutes))} gebruikt</span>
                          <span>{formatMinutes(availableMinutes)}</span>
                        </div>

                        <div
                          style={{
                            height: 8,
                            width: "100%",
                            borderRadius: 999,
                            background: colors.bgMuted,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${ratio}%`,
                              height: "100%",
                              borderRadius: 999,
                              background:
                                capacityStatus === "full"
                                  ? "#dc2626"
                                  : capacityStatus === "warning"
                                  ? "#f59e0b"
                                  : "#22c55e",
                              transition: "width 160ms ease",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: rowHeight,
                    background: rowBackground,
                    transition: "background 120ms ease",
                  }}
                  onDragOver={(e) => {
                    if (groupBy !== "post") return;

                    e.preventDefault();

                    if (dragOverPost !== group.label) {
                      setDragOverPost(group.label);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverPost === group.label) {
                      setDragOverPost(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (groupBy !== "post") return;

                    e.preventDefault();

                    const planningId = e.dataTransfer.getData("text/planningId");
                    if (!planningId) return;

                    onMoveTaskToPost?.(planningId, group.label);
                    setDragOverPost(null);
                    setDragOverDay(null);
                  }}
                >
                  {workdays.map((day) => {
                    const dayStart = new Date(`${day}T00:00:00`);
                    const nextDayStart = new Date(dayStart);
                    nextDayStart.setDate(nextDayStart.getDate() + 1);

                    const left =
                      ((dayStart.getTime() - bounds.start.getTime()) / (1000 * 60 * 60)) *
                      PX_PER_HOUR;

                    const width =
                      ((nextDayStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60)) *
                      PX_PER_HOUR;

                    return (
                      <div
                        key={`${group.label}-day-${day}`}
                        onDragOver={(e) => {
                          e.preventDefault();

                          if (dragOverDay !== day) {
                            setDragOverDay(day);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverDay === day) {
                            setDragOverDay(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();

                          const planningId = e.dataTransfer.getData("text/planningId");
                          if (!planningId) return;

                          onMoveTaskToDay?.(planningId, day);
                          setDragOverDay(null);
                          setDragOverPost(null);
                        }}
                        style={{
                          position: "absolute",
                          left,
                          top: 0,
                          width,
                          height: "100%",
                          background:
                            dragOverDay === day ? "rgba(255, 192, 0, 0.08)" : "transparent",
                          zIndex: 0,
                        }}
                      />
                    );
                  })}

                  {hourTicks.map((tick) => {
                    const left =
                      ((tick.getTime() - bounds.start.getTime()) / (1000 * 60 * 60)) *
                      PX_PER_HOUR;

                    return (
                      <div
                        key={tick.toISOString()}
                        style={{
                          position: "absolute",
                          left,
                          top: 0,
                          height: "100%",
                          borderLeft: "1px solid #f4f4f4",
                        }}
                      />
                    );
                  })}

                  {group.lanes.map((lane, laneIndex) =>
                    lane.map((task) => {
                      const isOverridden = overrides.some((o) => {
                        const stableMatch =
                          o.receptId === (task.receptId ?? null) &&
                          o.handelingId === (task.handelingId ?? null) &&
                          o.werkdagIso === (task.werkdagIso ?? null);

                        const fallbackMatch = o.planningId === task.planningId;

                        return stableMatch || fallbackMatch;
                      });

                      const minutesFromStart =
                        (task.start.getTime() - bounds.start.getTime()) / 60000;

                      const durationMinutes = Math.max(
                        15,
                        (task.end.getTime() - task.start.getTime()) / 60000
                      );

                      const left = (minutesFromStart / 60) * PX_PER_HOUR;
                      const width = (durationMinutes / 60) * PX_PER_HOUR;
                      const isSelected = selectedPlanningId === task.planningId;

                      const activeColor = getTaskActiveColor(
                        task,
                        isSelected,
                        isOverridden,
                        postColors
                      );

                      const passiveColor = getTaskPassiveColor(
                        task,
                        isSelected,
                        isOverridden,
                        postColors
                      );

                      const activeFlex =
                        task.activeMinutes > 0
                          ? task.activeMinutes
                          : Math.max(1, getTaskDurationMinutes(task) - task.passiveMinutes);

                      const passiveFlex = task.passiveMinutes;

                      const defaultShadow = isSelected
                        ? "0 0 0 1px rgba(0,0,0,0.08), 0 6px 14px rgba(0,0,0,0.14)"
                        : "0 2px 8px rgba(0,0,0,0.08)";

                      return (
                        <button
                          key={task.planningId}
                          type="button"
                          draggable={groupBy === "post" && !task.isBreak && !task.isLocked}
                          onDragOver={(e) => {
                            if (groupBy !== "post") return;
                            if (task.isBreak || task.isLocked) return;

                            const hasPlanningId = Array.from(e.dataTransfer.types).includes(
                              "text/planningId"
                            );

                            if (!hasPlanningId) return;

                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            if (groupBy !== "post") return;

                            e.preventDefault();
                            e.stopPropagation();

                            const draggedPlanningId =
                              e.dataTransfer.getData("text/planningId");

                            if (!draggedPlanningId) return;
                            if (draggedPlanningId === task.planningId) return;
                            if (task.isBreak || task.isLocked) return;

                            onMoveTaskAfterTask?.(draggedPlanningId, task.planningId);

                            setDragOverPost(null);
                            setDragOverDay(null);
                            setHoveredTask(null);
                          }}
                          onClick={() =>
                            onSelectPlanningId?.(isSelected ? null : task.planningId)
                          }
                          onDragStart={(e) => {
                            if (task.isLocked) {
                              e.preventDefault();
                              return;
                            }

                            setIsDragging(true);
                            e.dataTransfer.setData("text/planningId", task.planningId);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setIsDragging(false);
                            setDragOverPost(null);
                            setDragOverDay(null);
                            setHoveredTask(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 18px rgba(0,0,0,0.14)";

                            const rect = e.currentTarget.getBoundingClientRect();

                            setHoveredTask({
                              task,
                              isOverridden,
                              x: rect.left,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = defaultShadow;
                            setHoveredTask(null);
                          }}
                          style={{
                            position: "absolute",
                            left,
                            top: laneIndex * LANE_HEIGHT + (LANE_HEIGHT - BAR_HEIGHT) / 2,
                            width: Math.max(width, 92),
                            height: BAR_HEIGHT,
                            borderRadius: 12,
                            border: getTaskBorder(
                              task,
                              isSelected,
                              isOverridden,
                              capacityStatus
                            ),
                            background: "transparent",
                            color: getTaskTextColor(task, isOverridden),
                            padding: "7px 9px",
                            textAlign: "left",
                            cursor: task.isLocked ? "not-allowed" : "pointer",
                            boxShadow: isSelected
                              ? "0 0 0 3px rgba(255,192,0,0.6), 0 10px 22px rgba(0,0,0,0.18)"
                              : defaultShadow,
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                            zIndex: isSelected ? 5 : 1,
                            transition:
                              "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
                            opacity: isDragging ? 0.96 : 1,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              zIndex: 0,
                            }}
                          >
                            <div
                              style={{
                                flex: activeFlex,
                                background: activeColor,
                              }}
                            />

                            {passiveFlex > 0 ? (
                              <div
                                style={{
                                  flex: passiveFlex,
                                  background: passiveColor,
                                  borderLeft: `1px dashed ${colors.border}`,
                                }}
                              />
                            ) : null}
                          </div>

                          <div
                            style={{
                              position: "relative",
                              zIndex: 1,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 10,
                              fontWeight: 800,
                              opacity: 0.8,
                              marginBottom: 3,
                            }}
                          >
                            <span>
                              {formatTime(task.start)} - {formatTime(task.end)}
                            </span>
                            <span>
                              {task.isLocked ? "🔒" : ""}
                              {task.isFixed ? "📌" : ""}
                              {task.hasConflict ? "⚠" : ""}
                            </span>
                          </div>

                          <div
                            style={{
                              position: "relative",
                              zIndex: 1,
                              fontSize: 12,
                              fontWeight: 800,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: 1.2,
                            }}
                          >
                            {task.label}
                          </div>

                          {!task.isBreak && task.recipeLabel ? (
                            <div
                              style={{
                                position: "relative",
                                zIndex: 1,
                                fontSize: 10,
                                opacity: 0.72,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                lineHeight: 1.2,
                                marginTop: 2,
                              }}
                            >
                              {task.recipeLabel}
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredTask && !isDragging ? (
        <div
          style={{
            position: "fixed",
            left: getTooltipLeft(hoveredTask.x, 320),
            top: getTooltipTop(hoveredTask.y, 220),
            zIndex: 1000,
            background: colors.bg,
            border: "1px solid rgba(0,0,0,0.06)",
            lineHeight: 1.5,
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
            minWidth: 260,
            fontSize: 12,
            color: "#333",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, color: colors.text }}>
            {hoveredTask.task.isLocked ? "🔒 " : ""}
            {hoveredTask.task.isFixed ? "📌 " : ""}
            {hoveredTask.task.hasConflict ? "⚠ " : ""}
            {hoveredTask.task.label}
          </div>

          {hoveredTask.task.recipeLabel ? (
            <div style={{ marginBottom: 6 }}>
              <strong>Recept:</strong> {hoveredTask.task.recipeLabel}
            </div>
          ) : null}

          <div>
            <strong>Post:</strong> {hoveredTask.task.post}
          </div>
          <div>
            <strong>Toestel:</strong> {hoveredTask.task.toestel || "-"}
          </div>
          <div>
            <strong>Tijd:</strong> {formatTime(hoveredTask.task.start)} →{" "}
            {formatTime(hoveredTask.task.end)}
          </div>
          <div>
            <strong>Actieve werktijd:</strong> {formatMinutes(hoveredTask.task.activeMinutes)}
          </div>
          <div>
            <strong>Passieve wachttijd:</strong> {formatMinutes(hoveredTask.task.passiveMinutes)}
          </div>
          <div>
            <strong>Conflict:</strong> {hoveredTask.task.hasConflict ? "Ja" : "Nee"}
          </div>
          <div>
            <strong>Override:</strong> {hoveredTask.isOverridden ? "Ja" : "Nee"}
          </div>
        </div>
      ) : null}

      {hoveredCapacity && !isDragging ? (
        <div
          style={{
            position: "fixed",
            left: getTooltipLeft(hoveredCapacity.x, 340),
            top: getTooltipTop(hoveredCapacity.y, 250),
            zIndex: 1000,
            background: colors.bg,
            border: "1px solid rgba(0,0,0,0.06)",
            lineHeight: 1.5,
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
            minWidth: 260,
            fontSize: 12,
            color: "#333",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, color: colors.text }}>
            Capaciteit • {hoveredCapacity.label}
          </div>

          <div>
            <strong>Taken:</strong> {hoveredCapacity.taskCount}
          </div>
          <div>
            <strong>Gebruikt:</strong> {formatMinutes(hoveredCapacity.usedMinutes)}
          </div>
          <div>
            <strong>Beschikbaar:</strong> {formatMinutes(hoveredCapacity.availableMinutes)}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Grootste taken:</strong>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {hoveredCapacity.biggestTasks.length ? (
                hoveredCapacity.biggestTasks.map((task, index) => (
                  <div
                    key={`${task.label}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.label}
                    </span>
                    <span style={{ color: colors.textMuted }}>
                      {formatMinutes(Math.round(task.minutes))}
                    </span>
                  </div>
                ))
              ) : (
                <span style={{ color: colors.textMuted }}>Geen taken</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: colors.taskBg,
              border: "1px solid rgba(30, 64, 175, 0.22)",
              display: "inline-block",
            }}
          />
          Actieve werktijd
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: colors.bgMuted,
              border: `1px dashed ${colors.border}`,
              display: "inline-block",
            }}
          />
          Passieve wachttijd
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          📌 Vaste taak
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
          }}
        >
          🔒 Vergrendeld
        </span>
      </div>
    </div>
  );
}