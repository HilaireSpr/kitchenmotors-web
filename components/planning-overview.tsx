"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type PlanningRow = {
  "Planning ID"?: string | null;
  Werkdag?: string | null;
  Werkdag_iso?: string | null;
  Post?: string | null;
  Taak?: string | null;
  Recept?: string | null;
  Toestel?: string | null;
  Start?: string | null;
  Einde?: string | null;
  Locked?: boolean | null;
  "Is vaste taak"?: boolean | null;
  "Toestel conflict"?: boolean | null;
  Stappen?: string | null;

  "Dependency status"?: "ok" | "warning" | "blocked" | null;
  "Dependency warning"?: string | null;
  "Dependency previous task"?: string | null;
  "Dependency previous end"?: string | null;
  "Planner reden"?: string | null;
  "Planner score"?: string | null;
  "Planner kandidaatdagen"?: string | null;
};

type PlanningRun = {
  id: number;
  naam: string;
  beschrijving?: string | null;
  aangemaakt_op?: string | null;
  laatst_gebruikt_op?: string | null;
  actief?: boolean;
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
  border: `1px solid ${colors.primaryLight}`,
  background: colors.bg,
  borderRadius: 20,
  boxShadow: "0 8px 20px rgba(255, 192, 0, 0.15)",
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
  const [planningRuns, setPlanningRuns] = useState<PlanningRun[]>([]);
  const [selectedPlanningRunId, setSelectedPlanningRunId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getCurrentMondayIso());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<OverviewMode>("day");
  const [selectedPost, setSelectedPost] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("day");
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const savedRunId = localStorage.getItem("selectedPlanningRunId");
    const savedDate = localStorage.getItem("selectedPlanningDate");

    if (savedRunId) {
      setSelectedPlanningRunId(savedRunId);
    }

    if (savedDate) {
      setSelectedDate(savedDate);
    }

    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    if (selectedPlanningRunId) {
      localStorage.setItem("selectedPlanningRunId", selectedPlanningRunId);
    }
  }, [preferencesLoaded, selectedPlanningRunId]);

  useEffect(() => {
    if (!preferencesLoaded) return;

    if (selectedDate) {
      localStorage.setItem("selectedPlanningDate", selectedDate);
    }
  }, [preferencesLoaded, selectedDate]);

  const loadPlanningRunRows = async (
    planningRunId: string,
    options?: { keepSelectedDate?: boolean }
  ) => {
    if (!planningRunId) return;

    try {
      setLoading(true);

      if (!options?.keepSelectedDate) {
        setDragError(null);
      }

      const res = await fetch(`${API_URL}/api/v1/planning/runs/${planningRunId}`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      const loadedRows: PlanningRow[] = json?.result?.rows || [];

      setRows(loadedRows);

      const firstWorkday = loadedRows
        .map((row) => toIsoDay(row.Werkdag_iso || row.Werkdag))
        .filter((day): day is string => Boolean(day))
        .sort()[0];

      if (firstWorkday && !options?.keepSelectedDate) {
        setSelectedDate((current) => current || firstWorkday);
      }

      if (!options?.keepSelectedDate) {
        setSelectedPost("");
      }

      setExpandedTaskIds([]);
      setSelectedTaskId(null);
      setDragOverCell(null);
      setIsDraggingTask(false);
    } catch (error) {
      console.error("Fout bij laden planning rows:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanningRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/planning/runs`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      const runs: PlanningRun[] = json?.result || [];

      setPlanningRuns(runs);

      const activeRun = runs.find((run) => run.actief) || runs[0];
      const savedRunId = localStorage.getItem("selectedPlanningRunId");

      const preferredRun =
        runs.find((run) => String(run.id) === savedRunId) || activeRun;

      if (preferredRun) {
        const preferredRunId = String(preferredRun.id);

        setSelectedPlanningRunId(preferredRunId);
        await loadPlanningRunRows(preferredRunId, { keepSelectedDate: true });
      }
    } catch (error) {
      console.error("Fout bij ophalen planningen:", error);
      setPlanningRuns([]);
      setSelectedPlanningRunId("");
      setRows([]);
    }
  };

  useEffect(() => {
    if (!preferencesLoaded) return;

    loadPlanningRuns();

    const handlePlanningRunsChanged = () => {
      loadPlanningRuns();
    };

    window.addEventListener("planning-runs-changed", handlePlanningRunsChanged);
    window.addEventListener("focus", handlePlanningRunsChanged);

    return () => {
      window.removeEventListener("planning-runs-changed", handlePlanningRunsChanged);
      window.removeEventListener("focus", handlePlanningRunsChanged);
    };
  }, [preferencesLoaded]);

  const applyWorkdayOverride = async (planningId: string, targetWorkday: string) => {
    if (!targetWorkday) return;
    if (!selectedPlanningRunId) return;

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
          planning_run_id: Number(selectedPlanningRunId),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await loadPlanningRunRows(selectedPlanningRunId, { keepSelectedDate: true });
    } catch (error) {
      console.error("Fout bij verplaatsen naar andere dag:", error);
    } finally {
      setIsDraggingTask(false);
      setDragOverCell(null);
      setLoading(false);
    }
  };

  const applyPostOverride = async (planningId: string, targetPost: string) => {
    if (!targetPost) return;
    if (!selectedPlanningRunId) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/v1/planning/override/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          post_override: targetPost,
          planning_run_id: Number(selectedPlanningRunId),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await loadPlanningRunRows(selectedPlanningRunId, { keepSelectedDate: true });
    } catch (error) {
      console.error("Fout bij verplaatsen naar andere post:", error);
    } finally {
      setIsDraggingTask(false);
      setDragOverCell(null);
      setLoading(false);
    }
  };

  const applyToestelOverride = async (planningId: string, targetToestel: string) => {
    if (!planningId) return;
    if (!selectedPlanningRunId) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/v1/planning/override/toestel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          toestel_override: targetToestel,
          planning_run_id: Number(selectedPlanningRunId),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await loadPlanningRunRows(selectedPlanningRunId, { keepSelectedDate: true });
    } catch (error) {
      console.error("Fout bij toestel aanpassen:", error);
    } finally {
      setIsDraggingTask(false);
      setDragOverCell(null);
      setLoading(false);
    }
  };

  const applyTaskReorder = async (planningId: string, targetPlanningId: string) => {
    if (!planningId) return;
    if (!targetPlanningId) return;
    if (!selectedPlanningRunId) return;
    if (planningId === targetPlanningId) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/v1/planning/override/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          move_after_planning_id: targetPlanningId,
          planning_run_id: Number(selectedPlanningRunId),
        }),
      });

      if (!res.ok) {
        const text = await res.text();

        let message = "Deze verplaatsing is niet toegelaten.";

        try {
          const parsed = JSON.parse(text);
          message = parsed?.detail || message;
        } catch {
          message = text || message;
        }

        setDragError(message);
        await loadPlanningRunRows(selectedPlanningRunId, { keepSelectedDate: true });
        return;
      }

      await loadPlanningRunRows(selectedPlanningRunId, { keepSelectedDate: true });
    } catch (error) {
      console.error("Fout bij taakvolgorde aanpassen:", error);
    } finally {
      setIsDraggingTask(false);
      setDragOverCell(null);
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
            rows: [...postRows],
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

    return [...postRows].map((row, index) => ({
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
        tasks: [...postGroup.rows].map((row, index) => ({
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

  const getTasksForCell = (day: DayGroup, post: string) => {
    const found = day.posts.find((p) => p.post === post);
    return found?.rows || [];
  };

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

  const handleDropOnCell = async (rawRow: string, targetDay: string, targetPost: string) => {
    if (!rawRow) return;

    const draggedRow = JSON.parse(rawRow) as PlanningRow;
    const planningId = draggedRow["Planning ID"];
    const currentDay = toIsoDay(draggedRow.Werkdag_iso || draggedRow.Werkdag);
    const currentPost = draggedRow.Post || "";

    if (!planningId) return;
    if (draggedRow.Locked === true) return;

    if (currentDay !== targetDay) {
      await applyWorkdayOverride(planningId, targetDay);
    }

    if (currentPost !== targetPost) {
      await applyPostOverride(planningId, targetPost);
    }
  };

  const handleDropOnTask = async (rawRow: string, targetRow: PlanningRow, fallbackDay: string, fallbackPost: string) => {
    if (!rawRow) return;

    const draggedRow = JSON.parse(rawRow) as PlanningRow;
    const draggedPlanningId = draggedRow["Planning ID"];
    const targetPlanningId = targetRow["Planning ID"];

    if (!draggedPlanningId || !targetPlanningId) return;
    if (draggedPlanningId === targetPlanningId) return;
    if (draggedRow.Locked === true) return;

    const draggedDay = toIsoDay(draggedRow.Werkdag_iso || draggedRow.Werkdag);
    const targetDay = toIsoDay(targetRow.Werkdag_iso || targetRow.Werkdag) || fallbackDay;
    const draggedPost = draggedRow.Post || "";
    const targetPost = targetRow.Post || fallbackPost;

    if (draggedDay !== targetDay) {
      await applyWorkdayOverride(draggedPlanningId, targetDay);
    }

    if (draggedPost !== targetPost) {
      await applyPostOverride(draggedPlanningId, targetPost);
    }

    await applyTaskReorder(draggedPlanningId, targetPlanningId);
  };

  return (
    <div
      className={`planning-overview-root ${isFullscreen ? "planning-overview-fullscreen" : ""}`}
      data-print-mode={printMode}
      data-fullscreen={isFullscreen ? "true" : "false"}
      onDoubleClick={() => setIsFullscreen(true)}
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
            className="planning-overview-intro"
            style={{
              margin: "8px 0 0 0",
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: 780,
            }}
          >
            Compact overzicht van de planning per dag en per post...
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
        className="no-print planning-overview-controls"
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
            Planning
            <select
              value={selectedPlanningRunId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedPlanningRunId(value);
                loadPlanningRunRows(value);
              }}
              style={inputStyle}
            >
              <option value="">Kies een planning</option>
              {planningRuns.map((run) => (
                <option key={run.id} value={String(run.id)}>
                  {run.naam}
                  {run.actief ? " — actief" : ""}
                </option>
              ))}
            </select>
          </label>

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
                setDragOverCell(null);
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
                  setDragOverCell(null);
                }}
                style={{
                  background: isActive ? colors.primarySoft : colors.bg,
                  color: colors.text,
                  opacity: isActive ? 1 : 0.75,
                  fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${isActive ? colors.selectedBorder : colors.border}`,
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
            onClick={() => loadPlanningRunRows(selectedPlanningRunId)}
            disabled={loading || !selectedPlanningRunId}
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

          <button
            type="button"
            className="button"
            onClick={() => setIsFullscreen((current) => !current)}
            style={{
              background: isFullscreen ? colors.primarySoft : colors.bg,
              color: colors.text,
              border: `1px solid ${isFullscreen ? colors.selectedBorder : colors.border}`,
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 600,
            }}
          >
            {isFullscreen ? "Sluit fullscreen" : "Fullscreen"}
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

      {dragError ? (
        <div
          className="no-print"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {dragError}
        </div>
      ) : null}

      {groupedDays.length > 0 ? (
        <div
        className="planning-overview-scroll"  
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
              gridTemplateColumns: `120px repeat(${groupedDays.length}, minmax(220px, 1fr))`,
              gap: 10,
              alignItems: "start",
              minWidth: groupedDays.length > 0 ? 120 + groupedDays.length * 240 : undefined,
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
                className="planning-day-header"
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
                <div
                  className="planning-day-count"
                  style={{ fontSize: 12, color: colors.textMuted }}
                >
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
                  className="planning-day-title"
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    fontWeight: 800,
                    padding: "10px 8px",
                    fontSize: 18,
                    textAlign: "center",
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
                  const cellKey = `${day.day}-${post}`;

                  return (
                    <div
                      key={cellKey}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverCell !== cellKey) {
                          setDragOverCell(cellKey);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverCell === cellKey) {
                          setDragOverCell(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();

                        const rawRow = e.dataTransfer.getData("application/planning-row");

                        try {
                          await handleDropOnCell(rawRow, day.day, post);
                        } finally {
                          setDragOverCell(null);
                          setIsDraggingTask(false);
                        }
                      }}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 7,
                        background:
                          dragOverCell === cellKey
                            ? "#fff8de"
                            : mode === "aroundDay" && day.day === selectedDate
                              ? colors.primarySoft
                              : colors.bg,
                        outline: dragOverCell === cellKey ? `2px dashed ${colors.primary}` : "none",
                        outlineOffset: -2,
                        minHeight: 36,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
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
                          const taskId = String(row["Planning ID"] || `${day.day}-${post}-${index}`);
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

                                setSelectedTaskId(taskId);
                                setIsDraggingTask(true);
                                e.dataTransfer.setData(
                                  "application/planning-row",
                                  JSON.stringify(row)
                                );
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const rawRow = e.dataTransfer.getData("application/planning-row");

                                try {
                                  await handleDropOnTask(rawRow, row, day.day, post);
                                } finally {
                                  setDragOverCell(null);
                                  setIsDraggingTask(false);
                                }
                              }}
                              onDragEnd={() => {
                                setIsDraggingTask(false);
                                setDragOverCell(null);
                              }}
                              onClick={() => {
                                if (isDraggingTask) return;
                                toggleTaskExpanded(taskId);
                                setSelectedTaskId(taskId);
                              }}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                                padding: "7px 9px",
                                borderRadius: 10,
                                background:
                                  selectedTaskId === taskId ? colors.selectedBg : getRowBackground(row),
                                border: getRowBorder(row),
                                fontSize: 11,
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

                                  {row["Dependency status"] === "blocked" ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        background: "#fee2e2",
                                        color: "#991b1b",
                                        fontWeight: 700,
                                      }}
                                      title={row["Dependency warning"] || "Volgordeprobleem"}
                                    >
                                      ⚠ volgorde
                                    </span>
                                  ) : null}

                                  {row["Dependency status"] === "warning" ? (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        background: "#fef3c7",
                                        color: "#92400e",
                                        fontWeight: 700,
                                      }}
                                      title={
                                        row["Dependency warning"] ||
                                        "Afhankelijkheid niet controleerbaar"
                                      }
                                    >
                                      ? volgorde
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                style={{
                                  fontWeight: 800,
                                  color: colors.text,
                                  lineHeight: 1.2,
                                  fontSize: 12,
                                }}
                              >
                                {row.Taak || "Onbekend"}
                              </div>

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

                                  {row.Recept ? (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: colors.textMuted,
                                        lineHeight: 1.3,
                                        fontWeight: 600,
                                      }}
                                    >
                                      Recept: {row.Recept}
                                    </div>
                                  ) : null}

                                  {row["Planner reden"] ? (
                                    <div
                                      style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        background: "#fff8de",
                                        border: "1px solid #f6d860",
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
                                        Waarom zo gepland?
                                      </div>

                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: colors.text,
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {row["Planner reden"]}
                                      </div>

                                      {row["Planner score"] ? (
                                        <div
                                          style={{
                                            fontSize: 10,
                                            color: colors.textMuted,
                                          }}
                                        >
                                          Score: {row["Planner score"]}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {row["Planner kandidaatdagen"] ? (
                                    <details
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <summary
                                        style={{
                                          cursor: "pointer",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: colors.textMuted,
                                        }}
                                      >
                                        Planner analyse
                                      </summary>

                                      <pre
                                        style={{
                                          marginTop: 8,
                                          fontSize: 10,
                                          whiteSpace: "pre-wrap",
                                          overflowWrap: "break-word",
                                          color: colors.text,
                                        }}
                                      >
                                        {row["Planner kandidaatdagen"]}
                                      </pre>
                                    </details>
                                  ) : null}

                                  {row["Planning ID"] ? (
                                    <div
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}  
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        background: colors.bgMuted,
                                        border: `1px solid ${colors.border}`,
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
                                        Toestel override
                                      </div>

                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 6,
                                          alignItems: "center",
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <input
                                          type="text"
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          defaultValue={row.Toestel || ""}
                                          placeholder="Bijv. Snelkoeler 2"
                                          id={`toestel-${taskId}`}
                                          style={{
                                            padding: "5px 8px",
                                            borderRadius: 6,
                                            border: `1px solid ${colors.border}`,
                                            fontSize: 11,
                                            minWidth: 150,
                                            flex: 1,
                                          }}
                                        />

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();

                                            const input = document.getElementById(
                                              `toestel-${taskId}`
                                            ) as HTMLInputElement | null;

                                            if (!input) return;

                                            applyToestelOverride(
                                              row["Planning ID"] || "",
                                              input.value.trim()
                                            );
                                          }}
                                          style={{
                                            fontSize: 11,
                                            padding: "5px 8px",
                                            borderRadius: 6,
                                            border: `1px solid ${colors.border}`,
                                            background: colors.primarySoft,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Opslaan
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}

                                  {/* BESTAANDE BLOK LATEN STAAN */}

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

        .planning-overview-fullscreen {
          position: fixed !important;
          inset: 12px !important;
          z-index: 9999 !important;
          width: auto !important;
          height: auto !important;
          max-height: calc(100vh - 24px) !important;
          overflow: hidden !important;
          background: white !important;
        }

        .planning-overview-fullscreen > div {
          max-width: none !important;
        }

        .planning-overview-fullscreen .planning-overview-scroll {
          max-height: calc(100vh - 250px) !important;
        }
        
        .planning-overview-root[data-fullscreen="true"] {
          gap: 10px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-intro {
          display: none !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-controls {
          padding: 10px 14px !important;
          gap: 10px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-controls label {
          gap: 4px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-controls select,
        .planning-overview-root[data-fullscreen="true"] .planning-overview-controls input {
          padding: 8px 10px !important;
          min-height: 38px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-controls button {
          padding: 8px 12px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-overview-scroll {
          max-height: calc(100vh - 180px) !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-day-header {
          padding: 8px !important;
          border-radius: 10px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-day-title {
          font-size: 12px !important;
          margin-bottom: 2px !important;
        }

        .planning-overview-root[data-fullscreen="true"] .planning-day-count {
          font-size: 10px !important;
          line-height: 1.1 !important;
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
