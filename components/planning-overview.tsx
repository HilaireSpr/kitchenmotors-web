"use client";

import { useMemo, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type PlanningRow = {
  "Planning ID"?: string | null;
  Werkdag?: string | null;
  Werkdag_iso?: string | null;
  Post?: string | null;
  Taak?: string | null;
  Recept?: string | null;
  Start?: string | null;
  Einde?: string | null;
  Locked?: boolean | null;
  "Is vaste taak"?: boolean | null;
  "Toestel conflict"?: boolean | null;
  Stappen?: string | null;
};

type DayGroup = {
  day: string;
  posts: Array<{
    post: string;
    rows: PlanningRow[];
  }>;
};

type OverviewMode = "day" | "aroundDay" | "fromDate";
type PrintMode = "day" | "post";

function getCurrentMondayIso() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDayLabel(value: string | null | undefined) {
  if (!value) return "Onbekende dag";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toIsoDay(value: string | null | undefined) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRowBackground(row: PlanningRow) {
  if (row["Toestel conflict"] === true) return colors.conflictBg;
  if (row["Is vaste taak"] === true) return colors.fixedBg;
  if (row.Locked === true) return colors.lockedBg;
  return colors.taskBg;
}

function getRowBorder(row: PlanningRow) {
  if (row["Toestel conflict"] === true) return "1px solid #ef9a9a";
  if (row.Locked === true) return `1px solid ${colors.lockedBorder}`;
  if (row["Is vaste taak"] === true) return "1px solid #d6c36a";
  return "1px solid #bfdbfe";
}

function parseSteps(steps: string | null | undefined) {
  if (!steps) return [];

  return steps
    .split("|")
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => step.replace(/^\d+\.\s*/, "").trim());
}

function getAroundDayWindow(centerIso: string) {
  const center = new Date(`${centerIso}T00:00:00`);
  const result: string[] = [];

  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(center);
    d.setDate(d.getDate() + offset);
    result.push(d.toISOString().slice(0, 10));
  }

  return result;
}

const cardStyle = {
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  borderRadius: 20,
  boxShadow: "0 10px 30px rgba(17, 17, 17, 0.04)",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  outline: "none",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  fontSize: 12,
  color: colors.textMuted,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: colors.text,
};

export default function PlanningOverview() {
  const [rows, setRows] = useState<PlanningRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentMondayIso());
  const [mode, setMode] = useState<OverviewMode>("day");
  const [selectedPost, setSelectedPost] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("day");
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const runPlanning = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/v1/planning/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_monday: getCurrentMondayIso(),
          start_week: 1,
          cycles: 1,
          explain: true,
          overrides: [],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      setRows(json?.result?.rows || []);
      setSelectedPost("");
      setExpandedTaskIds([]);
      setSelectedTaskId(null);
      setDragOverDay(null);
      setIsDraggingTask(false);
    } catch (error) {
      console.error("Fout bij ophalen planning overview:", error);
      setRows([]);
      setSelectedPost("");
      setExpandedTaskIds([]);
      setSelectedTaskId(null);
      setDragOverDay(null);
      setIsDraggingTask(false);
    } finally {
      setLoading(false);
    }
  };

  const applyWorkdayOverride = async (planningId: string, targetWorkday: string) => {
    if (!targetWorkday) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/v1/planning/override/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          werkdag_override: targetWorkday,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await runPlanning();
    } catch (error) {
      console.error("Fout bij verplaatsen naar andere dag:", error);
    } finally {
      setIsDraggingTask(false);
      setDragOverDay(null);
      setLoading(false);
    }
  };

  const visibleDays = useMemo(() => {
    if (!selectedDate) return [];

    if (mode === "day") {
      return [selectedDate];
    }

    if (mode === "aroundDay") {
      return getAroundDayWindow(selectedDate);
    }

    return [];
  }, [selectedDate, mode]);

  const groupedDays = useMemo<DayGroup[]>(() => {
    const dayMap = new Map<string, Map<string, PlanningRow[]>>();

    for (const row of rows) {
      const isoDay = toIsoDay(row.Werkdag_iso || row.Werkdag);

      if (!isoDay) continue;

      if (mode === "day" && isoDay !== selectedDate) continue;
      if (mode === "aroundDay" && !visibleDays.includes(isoDay)) continue;
      if (mode === "fromDate" && isoDay < selectedDate) continue;

      const post = row.Post || "Onbekende post";

      if (!dayMap.has(isoDay)) {
        dayMap.set(isoDay, new Map<string, PlanningRow[]>());
      }

      const postMap = dayMap.get(isoDay)!;

      if (!postMap.has(post)) {
        postMap.set(post, []);
      }

      postMap.get(post)!.push(row);
    }

    return Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, postMap]) => ({
        day,
        posts: Array.from(postMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([post, postRows]) => ({
            post,
            rows: [...postRows].sort((a, b) => {
              const aTime = new Date(a.Start || "").getTime();
              const bTime = new Date(b.Start || "").getTime();
              return aTime - bTime;
            }),
          })),
      }));
  }, [rows, selectedDate, mode, visibleDays]);

  const allPosts = useMemo(() => {
    const set = new Set<string>();

    groupedDays.forEach((day) => {
      day.posts.forEach((p) => set.add(p.post));
    });

    return Array.from(set).sort();
  }, [groupedDays]);

  const getTasksForCell = (day: DayGroup, post: string) => {
    const found = day.posts.find((p) => p.post === post);
    return found?.rows || [];
  };

  const availablePosts = useMemo(() => {
    if (mode !== "day") return [];
    if (groupedDays.length === 0) return [];

    return groupedDays[0]?.posts.map((postGroup) => postGroup.post) || [];
  }, [groupedDays, mode]);

  const printablePostTasks = useMemo(() => {
    if (mode !== "day") return [];
    if (!selectedPost) return [];
    if (groupedDays.length === 0) return [];

    const selectedDayGroup = groupedDays[0];
    const postRows =
      selectedDayGroup.posts.find((postGroup) => postGroup.post === selectedPost)?.rows || [];

    return [...postRows]
      .sort((a, b) => {
        const aTime = new Date(a.Start || "").getTime();
        const bTime = new Date(b.Start || "").getTime();
        return aTime - bTime;
      })
      .map((row, index) => ({
        id: row["Planning ID"] || `${row.Post}-${row.Start}-${index}`,
        post: row.Post || "Onbekende post",
        werkdag: row.Werkdag || "",
        werkdagIso: row.Werkdag_iso || "",
        recept: row.Recept || "",
        handeling: row.Taak || "",
        start: row.Start || "",
        einde: row.Einde || "",
        stappen: parseSteps(row.Stappen),
        locked: row.Locked === true,
        isVasteTaak: row["Is vaste taak"] === true,
        conflict: row["Toestel conflict"] === true,
      }));
  }, [groupedDays, mode, selectedPost]);

  const printableDayPosts = useMemo(() => {
    if (mode !== "day") return [];
    if (groupedDays.length === 0) return [];

    const selectedDayGroup = groupedDays[0];

    return selectedDayGroup.posts
      .map((postGroup) => ({
        post: postGroup.post,
        tasks: [...postGroup.rows]
          .sort((a, b) => {
            const aTime = new Date(a.Start || "").getTime();
            const bTime = new Date(b.Start || "").getTime();
            return aTime - bTime;
          })
          .map((row, index) => ({
            id: row["Planning ID"] || `${row.Post}-${row.Start}-${index}`,
            post: row.Post || "Onbekende post",
            werkdag: row.Werkdag || "",
            werkdagIso: row.Werkdag_iso || "",
            recept: row.Recept || "",
            handeling: row.Taak || "",
            start: row.Start || "",
            einde: row.Einde || "",
            stappen: parseSteps(row.Stappen),
            locked: row.Locked === true,
            isVasteTaak: row["Is vaste taak"] === true,
            conflict: row["Toestel conflict"] === true,
          })),
      }))
      .filter((group) => group.tasks.length > 0);
  }, [groupedDays, mode]);

  const handlePrintDay = () => {
    if (mode !== "day") return;
    if (groupedDays.length === 0) return;

    setPrintMode("day");

    setTimeout(() => {
      window.print();
    }, 0);
  };

  const handlePrintPost = () => {
    if (mode !== "day") return;
    if (groupedDays.length === 0) return;
    if (!selectedPost) return;

    setPrintMode("post");

    setTimeout(() => {
      window.print();
    }, 0);
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleMoveTaskToDay = async (row: PlanningRow, targetDay: string) => {
    const planningId = row["Planning ID"];
    const currentDay = toIsoDay(row.Werkdag_iso || row.Werkdag);

    if (!planningId) return;
    if (!targetDay) return;
    if (!currentDay) return;
    if (row.Locked === true) return;
    if (currentDay === targetDay) return;

    await applyWorkdayOverride(planningId, targetDay);
  };

  return (
    <div
      className="planning-overview-root"
      data-print-mode={printMode}
      style={{
        ...cardStyle,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
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
          <h2 style={sectionTitleStyle}>Overzicht & print</h2>
          <p
            style={{
              margin: "8px 0 0 0",
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: 780,
            }}
          >
            Compact overzicht van de planning per dag en per post, met stappen voor uitvoering
            en printweergave voor de keuken.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            background: colors.primarySoft,
            border: `1px solid ${colors.primaryLight}`,
            fontSize: 12,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          {rows.length} planning rows
        </div>
      </div>

      <div
        className="no-print"
        style={{
          ...cardStyle,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: colors.bg,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <label style={labelStyle}>
            Datum
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedPost("");
                setExpandedTaskIds([]);
                setSelectedTaskId(null);
                setDragOverDay(null);
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Gekozen post
            <select
              value={selectedPost}
              onChange={(e) => setSelectedPost(e.target.value)}
              disabled={mode !== "day" || availablePosts.length === 0}
              style={inputStyle}
            >
              <option value="">Kies een post</option>
              {availablePosts.map((post) => (
                <option key={post} value={post}>
                  {post}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {[
            { key: "day", label: "Alleen gekozen dag" },
            { key: "aroundDay", label: "Rond geselecteerde dag" },
            { key: "fromDate", label: "Vanaf gekozen datum" },
          ].map((item) => {
            const isActive = mode === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className="button"
                onClick={() => {
                  setMode(item.key as OverviewMode);
                  setSelectedPost("");
                  setExpandedTaskIds([]);
                  setSelectedTaskId(null);
                  setDragOverDay(null);
                }}
                style={{
                  background: isActive ? colors.primarySoft : colors.bg,
                  color: colors.text,
                  opacity: isActive ? 1 : 0.75,
                  fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${
                    isActive ? colors.selectedBorder : colors.border
                  }`,
                  borderRadius: 999,
                  padding: "10px 14px",
                }}
              >
                {item.label}
              </button>
            );
          })}

          <button
            className="button"
            onClick={runPlanning}
            disabled={loading}
            style={{
              background: colors.primary,
              color: colors.text,
              opacity: loading ? 0.7 : 1,
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(255, 192, 0, 0.24)",
            }}
          >
            {loading ? "Planning laden..." : "Laad planningsoverzicht"}
          </button>

          <button
            type="button"
            className="button"
            onClick={handlePrintDay}
            disabled={mode !== "day" || groupedDays.length === 0}
            style={{
              background: colors.bg,
              color: colors.text,
              opacity: mode === "day" && groupedDays.length > 0 ? 1 : 0.5,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 600,
            }}
          >
            Print gekozen dag
          </button>

          <button
            type="button"
            className="button"
            onClick={handlePrintPost}
            disabled={mode !== "day" || groupedDays.length === 0 || !selectedPost}
            style={{
              background: colors.bg,
              color: colors.text,
              opacity: mode === "day" && groupedDays.length > 0 && selectedPost ? 1 : 0.5,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 600,
            }}
          >
            Print gekozen post
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: colors.textMuted,
            lineHeight: 1.5,
          }}
        >
          Afdrukken werkt momenteel voor <strong>Alleen gekozen dag</strong>, als
          dagoverzicht of per gekozen post.
        </div>
      </div>

      {!loading && rows.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: colors.bgMuted,
            color: colors.textMuted,
          }}
        >
          Nog geen planning geladen.
        </div>
      ) : null}

      {!loading && rows.length > 0 && groupedDays.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: colors.bgMuted,
            color: colors.textMuted,
          }}
        >
          {mode === "day"
            ? "Geen taken zichtbaar op de gekozen dag."
            : mode === "aroundDay"
            ? "Geen taken zichtbaar rond de gekozen dag."
            : "Geen taken zichtbaar vanaf de gekozen datum."}
        </div>
      ) : null}

      {groupedDays.length > 0 ? (
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "72vh",
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `220px repeat(${groupedDays.length}, minmax(260px, 1fr))`,
              gap: 14,
              alignItems: "start",
              minWidth: groupedDays.length > 0 ? 220 + groupedDays.length * 280 : undefined,
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 30,
                background: colors.bg,
                borderRadius: 12,
              }}
            />

            {groupedDays.map((day) => (
              <div
                key={day.day}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  padding: 14,
                  textAlign: "center",
                  border: `1px solid ${colors.border}`,
                  background:
                    mode === "aroundDay" && day.day === selectedDate
                      ? colors.primarySoft
                      : colors.bgMuted,
                  borderRadius: 14,
                  boxShadow: "0 6px 16px rgba(17,17,17,0.03)",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: colors.text,
                    fontSize: 15,
                    marginBottom: 4,
                  }}
                >
                  {formatDayLabel(day.day)}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>
                  {day.posts.reduce((sum, p) => sum + p.rows.length, 0)} handelingen
                </div>
              </div>
            ))}

            {allPosts.map((post) => (
              <div
                key={`row-${post}`}
                style={{
                  display: "contents",
                }}
              >
                <div
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    fontWeight: 800,
                    padding: 14,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgMuted,
                    borderRadius: 14,
                    color: colors.text,
                    boxShadow: "0 6px 16px rgba(17,17,17,0.03)",
                  }}
                >
                  {post}
                </div>

                {groupedDays.map((day) => {
                  const cellRows = getTasksForCell(day, post);

                  return (
                    <div
                      key={`${day.day}-${post}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverDay !== day.day) {
                          setDragOverDay(day.day);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverDay === day.day) {
                          setDragOverDay(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();

                        const rawRow = e.dataTransfer.getData("application/planning-row");
                        if (!rawRow) {
                          setDragOverDay(null);
                          setIsDraggingTask(false);
                          return;
                        }

                        try {
                          const draggedRow = JSON.parse(rawRow) as PlanningRow;
                          await handleMoveTaskToDay(draggedRow, day.day);
                        } finally {
                          setDragOverDay(null);
                          setIsDraggingTask(false);
                        }
                      }}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 10,
                        background:
                          dragOverDay === day.day
                            ? "#fff8de"
                            : mode === "aroundDay" && day.day === selectedDate
                            ? colors.primarySoft
                            : colors.bg,
                        outline: dragOverDay === day.day ? `2px dashed ${colors.primary}` : "none",
                        outlineOffset: -2,
                        minHeight: 48,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: "background 120ms ease, outline 120ms ease",
                        boxShadow: "0 6px 16px rgba(17,17,17,0.03)",
                      }}
                    >
                      {cellRows.length === 0 ? (
                        <div
                          style={{
                            height: 34,
                            borderRadius: 10,
                            border: `1px dashed ${colors.border}`,
                            opacity: 0.35,
                            background: colors.bgMuted,
                          }}
                        />
                      ) : (
                        cellRows.map((row, index) => {
                          const taskId = String(
                            row["Planning ID"] || `${day.day}-${post}-${index}`
                          );
                          const isExpanded = expandedTaskIds.includes(taskId);
                          const steps = parseSteps(row.Stappen);

                          return (
                            <div
                              key={taskId}
                              className="print-task-row"
                              draggable={row.Locked !== true}
                              onDragStart={(e) => {
                                if (row.Locked === true) {
                                  e.preventDefault();
                                  return;
                                }

                                setIsDraggingTask(true);
                                e.dataTransfer.setData(
                                  "application/planning-row",
                                  JSON.stringify(row)
                                );
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setIsDraggingTask(false);
                                setDragOverDay(null);
                              }}
                              onClick={() => {
                                if (isDraggingTask) return;
                                toggleTaskExpanded(taskId);
                                setSelectedTaskId(taskId);
                              }}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                padding: "10px 12px",
                                borderRadius: 12,
                                background:
                                  selectedTaskId === taskId
                                    ? colors.selectedBg
                                    : getRowBackground(row),
                                border: getRowBorder(row),
                                fontSize: 12,
                                cursor: row.Locked === true ? "not-allowed" : "grab",
                                opacity: isDraggingTask && selectedTaskId === taskId ? 0.7 : 1,
                                boxShadow:
                                  selectedTaskId === taskId
                                    ? "0 8px 18px rgba(255, 192, 0, 0.14)"
                                    : "0 4px 12px rgba(17,17,17,0.04)",
                              }}
                              title={
                                isExpanded
                                  ? "Klik om stappen te verbergen"
                                  : "Klik om stappen te tonen"
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: colors.textMuted,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  {formatTime(row.Start)} - {formatTime(row.Einde)}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {row.Locked ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        background: colors.lockedBg,
                                        color: "#9a6700",
                                        fontWeight: 700,
                                      }}
                                    >
                                      🔒
                                    </span>
                                  ) : null}

                                  {row["Is vaste taak"] ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        background: colors.fixedBg,
                                        color: "#5b21b6",
                                        fontWeight: 700,
                                      }}
                                    >
                                      📌
                                    </span>
                                  ) : null}

                                  {row["Toestel conflict"] ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        background: colors.conflictBg,
                                        color: "#9f1d1d",
                                        fontWeight: 700,
                                      }}
                                    >
                                      ⚠
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                style={{
                                  fontWeight: 800,
                                  color: colors.text,
                                  lineHeight: 1.35,
                                }}
                              >
                                {row.Taak || "Onbekend"}
                              </div>

                              {row.Recept ? (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: colors.textMuted,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {row.Recept}
                                </div>
                              ) : null}

                              {isExpanded ? (
                                <div
                                  style={{
                                    marginTop: 4,
                                    paddingTop: 8,
                                    borderTop: `1px solid ${colors.border}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 800,
                                      color: colors.textMuted,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    Stappen
                                  </div>

                                  {steps.length > 0 ? (
                                    <ul
                                      style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        display: "grid",
                                        gap: 5,
                                      }}
                                    >
                                      {steps.map((step, stepIndex) => (
                                        <li
                                          key={`${taskId}-step-${stepIndex}`}
                                          style={{
                                            fontSize: 11,
                                            color: colors.text,
                                            lineHeight: 1.4,
                                          }}
                                        >
                                          {step}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: colors.textMuted,
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Geen stappen gevonden.
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {printMode === "day" && mode === "day" && printableDayPosts.length > 0 ? (
        <div className="print-day-only">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>Dagoverzicht keukenplanning</h1>
              <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
                {groupedDays[0] ? formatDayLabel(groupedDays[0].day) : "-"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {printableDayPosts.map((postGroup) => (
                <div
                  key={postGroup.post}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    breakInside: "avoid",
                    pageBreakInside: "avoid",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: "#ececec",
                      border: "1px solid #d5d5d5",
                    }}
                  >
                    {postGroup.post}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {postGroup.tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          border: "1px solid #d6c36a",
                          background: "#f6ebbd",
                          padding: "10px 12px",
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#000",
                                lineHeight: 1.25,
                              }}
                            >
                              {task.handeling}
                            </div>

                            {task.recept ? (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 14,
                                  color: "#555",
                                }}
                              >
                                {task.recept}
                              </div>
                            ) : null}
                          </div>

                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#333",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {formatTime(task.start)} - {formatTime(task.einde)}
                          </div>
                        </div>

                        <div
                          style={{
                            borderTop: "1px solid rgba(0,0,0,0.12)",
                            paddingTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#444",
                            }}
                          >
                            Stappen
                          </div>

                          {task.stappen.length > 0 ? (
                            <ul
                              style={{
                                margin: 0,
                                paddingLeft: 18,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                fontSize: 14,
                                lineHeight: 1.35,
                                color: "#000",
                              }}
                            >
                              {task.stappen.map((step, stepIndex) => (
                                <li
                                  key={`${task.id}-${stepIndex}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                    listStyle: "none",
                                    marginLeft: -18,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 15,
                                      lineHeight: 1.2,
                                      flexShrink: 0,
                                    }}
                                  >
                                    ☐
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#666",
                                fontStyle: "italic",
                              }}
                            >
                              Geen stappen gevonden.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {printMode === "post" && mode === "day" && selectedPost && printablePostTasks.length > 0 ? (
        <div className="print-post-only">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>Takenlijst per post</h1>
              <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
                {groupedDays[0] ? formatDayLabel(groupedDays[0].day) : "-"} — {selectedPost}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {printablePostTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    border: "1px solid #d6c36a",
                    background: "#f6ebbd",
                    padding: "10px 12px",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    breakInside: "avoid",
                    pageBreakInside: "avoid",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#000",
                          lineHeight: 1.25,
                        }}
                      >
                        {task.handeling}
                      </div>

                      {task.recept ? (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 14,
                            color: "#555",
                          }}
                        >
                          {task.recept}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#333",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(task.start)} - {formatTime(task.einde)}
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid rgba(0,0,0,0.12)",
                      paddingTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#444",
                      }}
                    >
                      Stappen
                    </div>

                    {task.stappen.length > 0 ? (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          fontSize: 14,
                          lineHeight: 1.35,
                          color: "#000",
                        }}
                      >
                        {task.stappen.map((step, stepIndex) => (
                          <li
                            key={`${task.id}-${stepIndex}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                              listStyle: "none",
                              marginLeft: -18,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 15,
                                lineHeight: 1.2,
                                flexShrink: 0,
                              }}
                            >
                              ☐
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        Geen stappen gevonden.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .print-post-only {
          display: none;
        }

        .print-day-only {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .planning-overview-root,
          .planning-overview-root * {
            visibility: visible !important;
          }

          .planning-overview-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            gap: 10px !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-task-row {
            break-inside: avoid;
            page-break-inside: avoid;
            border-radius: 0 !important;
            padding: 6px 8px !important;
            background: white !important;
            box-shadow: none !important;
          }

          .planning-overview-root[data-print-mode="post"] > * {
            display: none !important;
          }

          .planning-overview-root[data-print-mode="day"] > * {
            display: none !important;
          }

          .planning-overview-root[data-print-mode="day"] .print-day-only,
          .planning-overview-root[data-print-mode="day"] .print-day-only * {
            visibility: visible !important;
          }

          .planning-overview-root[data-print-mode="day"] .print-day-only {
            display: block !important;
          }

          .planning-overview-root[data-print-mode="post"] .print-post-only,
          .planning-overview-root[data-print-mode="post"] .print-post-only * {
            visibility: visible !important;
          }

          .planning-overview-root[data-print-mode="post"] .print-post-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}