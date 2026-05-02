"use client";

import { useEffect, useMemo, useState } from "react";
import PlannerGantt from "./planner-gantt";
import { colors } from "@/styles/colors";

type PlannerRow = {
  "Planning ID"?: string | null;
  "Recept ID"?: number | null;
  "Handeling ID"?: number | null;
  Onderdeel?: string | null;
  Cyclus?: string | null;
  Serveerdag?: string | null;
  Recept?: string | null;
  "Prognose aantal"?: number | null;
  "Menu-groep"?: string | null;
  "Periode naam"?: string | null;
  Taak?: string | null;
  Post?: string | null;
  Toestel?: string | null;
  Werkdag?: string | null;
  Werkdag_iso?: string | null;
  "Startuur post"?: string | null;
  Start?: string | null;
  Einde?: string | null;
  "Actieve tijd"?: number | null;
  "Passieve tijd"?: number | null;
  "Totale duur"?: number | null;
  Stappen?: string | null;
  "Voorkeur offset"?: number | null;
  "Min offset"?: number | null;
  "Max offset"?: number | null;
  "Gekozen offset"?: number | null;
  "Planner score"?: string | null;
  "Planner reden"?: string | null;
  "Planner kandidaatdagen"?: string | null;
  "Toestel conflict"?: boolean | null;
  "Conflict details"?: string | null;
  Locked?: boolean | null;
};

type CapacityRow = {
  Werkdag_iso: string;
  Werkdag: string;
  Post: string;
  "Geplande minuten": number;
  "Capaciteit minuten": number;
  "Belasting pct": number | null;
  Status: string;
};

type ConflictRow = {
  Werkdag_iso: string;
  Toestel: string;
  "Planning ID A": string;
  "Taak A": string;
  "Post A": string;
  "Start A": string;
  "Einde A": string;
  "Planning ID B": string;
  "Taak B": string;
  "Post B": string;
  "Start B": string;
  "Einde B": string;
};

type PlannerResponse = {
  success: boolean;
  result: {
    rows: PlannerRow[];
    row_count: number;
    capacity_summary?: CapacityRow[];
    conflict_summary?: ConflictRow[];
    conflict_count?: number;
    debug_counts?: Record<string, number>;
  };
};

type MenuItemRow = {
  id: number;
  menu_groep?: string | null;
  recept_menu_groep?: string | null;
};

type ApiListResponse<T> = {
  success?: boolean;
  result?: T[];
  data?: T[];
};

type PlanningStartuurRow = {
  werkdag: string;
  post: string;
  starttijd: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }

  return [];
}

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

function getTodayIso() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function getNextMondayIso() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function isBeforeToday(dateString: string) {
  return dateString < getTodayIso();
}

function isMonday(dateString: string) {
  if (!dateString) return false;
  const d = new Date(`${dateString}T00:00:00`);
  return d.getDay() === 1;
}

function formatIsoDate(value: string | null | undefined) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatMinutes(value: number | null | undefined) {
  if (value == null) return "";
  const minutes = Number(value);
  if (Number.isNaN(minutes)) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}u ${rest.toString().padStart(2, "0")}m`;
}

function isBreakRow(row: PlannerRow) {
  return row.Taak === "🕒 Pauze";
}

function statusStyle(status: string | undefined) {
  if (status === "Overbelast") {
    return {
      background: colors.conflictBg,
      color: "#9f1d1d",
    };
  }

  if (status === "Zwaar") {
    return {
      background: colors.lockedBg,
      color: "#9a6700",
    };
  }

  return {
    background: "#e9f7ef",
    color: "#1e6b3a",
  };
}

const cardStyle = {
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  borderRadius: 20,
  boxShadow: "0 10px 30px rgba(17, 17, 17, 0.04)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  outline: "none",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  marginBottom: 8,
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

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const compactStatsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(104px, max-content))",
  gap: 8,
  alignItems: "start",
};

const compactStatCardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  background: colors.bgMuted,
  padding: "8px 10px",
  minWidth: 104,
  maxWidth: 170,
};

const compactStatLabelStyle = {
  fontSize: 10,
  color: colors.textMuted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const compactStatValueStyle = {
  marginTop: 4,
  fontSize: 20,
  fontWeight: 800,
  color: colors.text,
  lineHeight: 1,
};

export default function PlannerTest() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlannerResponse | null>(null);
  const [error, setError] = useState("");

  const [selectedWorkday, setSelectedWorkday] = useState("all");
  const [selectedPost, setSelectedPost] = useState("all");
  const [selectedMenuGroup, setSelectedMenuGroup] = useState("all");
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);
  const [selectedPlanningId, setSelectedPlanningId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"post" | "toestel">("post");
  const [overridePost, setOverridePost] = useState("");
  const [overrideWorkday, setOverrideWorkday] = useState("");
  const [activeTab, setActiveTab] = useState<
    "planning" | "starturen" | "capaciteit" | "conflicten"
  >("planning");
  const [startMonday, setStartMonday] = useState(getNextMondayIso());
  const [startWeek, setStartWeek] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [planningName, setPlanningName] = useState("");
  const [menuGroups, setMenuGroups] = useState<string[]>([]);
  const [planningStarturen, setPlanningStarturen] = useState<PlanningStartuurRow[]>([]);
  const [savingStartuurKey, setSavingStartuurKey] = useState<string | null>(null);
  const [postColors, setPostColors] = useState<Record<string, string>>({});

  async function loadMenuGroups() {
    try {
      const res = await fetch(`${API_URL}/api/v1/menu/items`);
      if (!res.ok) {
        throw new Error("Kon menu-items niet ophalen");
      }

      const json: ApiListResponse<MenuItemRow> | MenuItemRow[] = await res.json();
      const items = extractArray<MenuItemRow>(json);

      const groepen = Array.from(
        new Set(
          items
            .map((item) => item.menu_groep || item.recept_menu_groep || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      setMenuGroups(groepen);
    } catch (err) {
      console.error("Fout bij laden menu-groepen:", err);
    }
  }

  useEffect(() => {
    loadMenuGroups();
    loadPlanningStarturen();
    loadPostColors();
  }, []);

  async function loadPlanningStarturen() {
    try {
      const res = await fetch(`${API_URL}/api/v1/base-data/planning-starturen`);

      if (!res.ok) {
        throw new Error("Kon planning-starturen niet ophalen");
      }

      const json: ApiListResponse<PlanningStartuurRow> | PlanningStartuurRow[] =
        await res.json();

      const rows = extractArray<PlanningStartuurRow>(json);
      setPlanningStarturen(rows);
    } catch (err) {
      console.error("Fout bij laden planning-starturen:", err);
      setPlanningStarturen([]);
    }
  }

  async function loadPostColors() {
    try {
      const res = await fetch(`${API_URL}/api/v1/base-data/posten`);

      if (!res.ok) {
        throw new Error("Kon posten niet ophalen");
      }

      const json = await res.json();

      const map: Record<string, string> = {};

      (json.result || []).forEach((p: any) => {
        map[p.naam] = p.kleur || "#dbeafe";
      });

      setPostColors(map);
    } catch (err) {
      console.error("Post colors load error", err);
    }
  }

  async function savePlanningStartuur(
    werkdag: string,
    post: string,
    starttijd: string
  ) {
    const key = `${werkdag}|${post}`;
    setSavingStartuurKey(key);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/base-data/planning-starturen`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          werkdag,
          post,
          starttijd,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kon startuur niet opslaan");
      }

      setPlanningStarturen((prev) =>
        prev.map((row) =>
          row.werkdag === werkdag && row.post === post
            ? { ...row, starttijd }
            : row
        )
      );

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon startuur niet opslaan");
    } finally {
      setSavingStartuurKey(null);
    }
  }

  function updatePlanningStartuurLocal(
    werkdag: string,
    post: string,
    starttijd: string
  ) {
    setPlanningStarturen((prev) =>
      prev.map((row) =>
        row.werkdag === werkdag && row.post === post
          ? { ...row, starttijd }
          : row
      )
    );
  }

  async function runPlanner() {
    if (!startMonday) {
      setError("Kies eerst een startdatum.");
      return;
    }

    if (isBeforeToday(startMonday)) {
      setError("De startdatum mag niet in het verleden liggen.");
      return;
    }

    if (!isMonday(startMonday)) {
      setError("De startdatum moet een maandag zijn.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/planning/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_monday: startMonday,
          start_week: startWeek,
          end_date: endDate || null,
          planning_naam: planningName || null,
          explain: true,
          menu_groep: selectedMenuGroup === "all" ? null : selectedMenuGroup,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      setData(json);
      setSelectedPlanningId(null);
      await loadPlanningStarturen();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  async function applyPostOverride(planningId: string, targetPost: string) {
    if (!targetPost) {
      setError("Kies eerst een post.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/planning/override/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          post_override: targetPost,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  async function setTaskLock(planningId: string, locked: boolean) {
    try {
      const res = await fetch(`${API_URL}/api/v1/planning/set-lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          locked,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lock update mislukt: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      console.error(err);
    }
  }

  async function clearTaskOverride(planningId: string) {
    try {
      const res = await fetch(`${API_URL}/api/v1/planning/clear-override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Reset mislukt: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      console.error(err);
    }
  }

  async function applyWorkdayOverride(planningId: string, targetWorkday: string) {
    if (!targetWorkday) {
      setError("Kies eerst een werkdag.");
      return;
    }

    setLoading(true);
    setError("");

    try {
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

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  async function applyTaskReorder(planningId: string, targetPlanningId: string) {
    if (!planningId || !targetPlanningId) return;
    if (planningId === targetPlanningId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/planning/override/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          move_after_planning_id: targetPlanningId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon taakvolgorde niet bewaren");
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveTaskToDay(planningId: string, targetWerkdagIso: string) {
    const row = previewRows.find((item) => item["Planning ID"] === planningId);
    if (!row) return;
    if (!targetWerkdagIso) return;
    if (row.Werkdag_iso === targetWerkdagIso) return;
    if (row.Locked === true) return;

    await applyWorkdayOverride(planningId, targetWerkdagIso);
  }

  async function applyResetOverride(planningId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/planning/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  async function applyTaskLock(planningId: string, locked: boolean) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/planning/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planning_id: planningId,
          locked,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      await runPlanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  const rows = data?.result.rows ?? [];
  const capacityRows = data?.result.capacity_summary ?? [];
  const conflictRows = data?.result.conflict_summary ?? [];

  const workdays = useMemo(() => {
    const unique = Array.from(
      new Set(
        rows.map((row) => row.Werkdag_iso).filter((day): day is string => Boolean(day))
      )
    );

    return unique.sort();
  }, [rows]);

  const posts = useMemo(() => {
    const unique = Array.from(new Set(rows.map((row) => row.Post).filter(Boolean))) as string[];
    return unique.sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const workdayOk = selectedWorkday === "all" || row.Werkdag_iso === selectedWorkday;
      const postOk = selectedPost === "all" || row.Post === selectedPost;
      const menuGroupOk = true;
      const conflictOk = !showOnlyConflicts || row["Toestel conflict"] === true;

      return workdayOk && postOk && menuGroupOk && conflictOk;
    });
  }, [rows, selectedWorkday, selectedPost, showOnlyConflicts]);

  const previewRows = filteredRows;

  const filteredCapacityRows = useMemo(() => {
    return capacityRows.filter((row) => {
      const workdayOk = selectedWorkday === "all" || row.Werkdag_iso === selectedWorkday;
      const postOk = selectedPost === "all" || row.Post === selectedPost;

      return workdayOk && postOk;
    });
  }, [capacityRows, selectedWorkday, selectedPost]);

  const filteredConflictRows = useMemo(() => {
    return conflictRows.filter((row) => {
      const workdayOk = selectedWorkday === "all" || row.Werkdag_iso === selectedWorkday;
      const postOk =
        selectedPost === "all" || row["Post A"] === selectedPost || row["Post B"] === selectedPost;

      return workdayOk && postOk;
    });
  }, [conflictRows, selectedWorkday, selectedPost]);

  const visiblePlanningStarturen = useMemo(() => {
    return planningStarturen.filter((row) => {
      const workdayOk = selectedWorkday === "all" || row.werkdag === selectedWorkday;
      const postOk = selectedPost === "all" || row.post === selectedPost;
      return workdayOk && postOk;
    });
  }, [planningStarturen, selectedWorkday, selectedPost]);

  const selectedRow = useMemo(() => {
    if (!selectedPlanningId) return null;
    return previewRows.find((row) => row["Planning ID"] === selectedPlanningId) ?? null;
  }, [previewRows, selectedPlanningId]);

  const availableWorkdaysForMove = useMemo(() => {
    return workdays.filter((day) => day && (!selectedRow || day !== selectedRow.Werkdag_iso));
  }, [workdays, selectedRow]);

  const isSelectedLocked = selectedRow?.Locked === true;

  useEffect(() => {
    if (!selectedRow) {
      setOverridePost("");
      setOverrideWorkday("");
      return;
    }

    setOverridePost(selectedRow.Post ?? "");

    const nextWorkday = selectedRow.Werkdag_iso ?? "";
    setOverrideWorkday(workdays.includes(nextWorkday) ? nextWorkday : "");
  }, [selectedRow, workdays]);

  useEffect(() => {
    if (selectedWorkday === "all") return;
    if (workdays.includes(selectedWorkday)) return;

    setSelectedWorkday("all");
  }, [selectedWorkday, workdays]);

  const statCards = [
    {
      label: "Zichtbare rows",
      value: String(previewRows.length),
    },
    {
      label: "Totale rows",
      value: String(data?.result.row_count ?? 0),
    },
    {
      label: "Toestelconflicten",
      value: String(data?.result.conflict_count ?? 0),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
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
            <h2 style={sectionTitleStyle}>Planner run</h2>
            <p
              style={{
                margin: "8px 0 0 0",
                color: colors.textMuted,
                fontSize: 15,
                lineHeight: 1.5,
                maxWidth: 760,
              }}
            >
              Genereer een planning vanaf een gekozen startmaandag en filter meteen op
              menu-groep, werkdag of post.
            </p>
          </div>

          <div
            style={{
              ...pillStyle,
              background: colors.primarySoft,
              color: colors.text,
              border: `1px solid ${colors.primaryLight}`,
            }}
          >
            Sales demo screen
          </div>
        </div>

        {error ? (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: colors.conflictBg,
              border: `1px solid ${colors.danger}`,
              color: colors.text,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Fout: {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <div style={labelStyle}>Menu-groep</div>
            <select
              style={inputStyle}
              value={selectedMenuGroup}
              onChange={(e) => setSelectedMenuGroup(e.target.value)}
              onFocus={loadMenuGroups}
            >
              <option value="all">Alle menu-groepen</option>
              {menuGroups.map((groep) => (
                <option key={groep} value={groep}>
                  {groep}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Startmaandag</div>
            <input
              style={inputStyle}
              type="date"
              min={getTodayIso()}
              value={startMonday}
              onChange={(e) => setStartMonday(e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Planning naam</div>
            <input
              style={inputStyle}
              value={planningName}
              onChange={(e) => setPlanningName(e.target.value)}
              placeholder="Bijv. Zomerplanning 2026"
            />
          </div>

          <div>
            <div style={labelStyle}>Startweek</div>
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={startWeek}
              onChange={(e) => setStartWeek(Number(e.target.value))}
            />
          </div>

          <div>
            <div style={labelStyle}>Einddatum</div>
            <input
              style={inputStyle}
              type="date"
              min={startMonday}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            className="button"
            onClick={runPlanner}
            disabled={loading}
            style={{
              background: colors.primary,
              color: colors.text,
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(255, 192, 0, 0.24)",
            }}
          >
            {loading ? "Planner draait..." : "Run planner"}
          </button>

          {!isMonday(startMonday) ? (
            <span style={{ fontSize: 13, color: colors.danger, fontWeight: 600 }}>
              Kies een maandag als startdatum.
            </span>
          ) : null}
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            style={{ ...inputStyle, maxWidth: 220 }}
            value={selectedWorkday}
            onChange={(e) => setSelectedWorkday(e.target.value)}
          >
            <option value="all">Alle werkdagen</option>
            {workdays.map((workday) => (
              <option key={workday} value={workday}>
                {formatIsoDate(workday)}
              </option>
            ))}
          </select>

          <select
            style={{ ...inputStyle, maxWidth: 220 }}
            value={selectedPost}
            onChange={(e) => setSelectedPost(e.target.value)}
          >
            <option value="all">Alle posten</option>
            {posts.map((post) => (
              <option key={post} value={post}>
                {post}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={showOnlyConflicts}
              onChange={(e) => setShowOnlyConflicts(e.target.checked)}
            />
            Alleen conflicten
          </label>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, color: colors.textMuted, fontWeight: 600 }}>
              Groeperen op:
            </span>

            <button
              type="button"
              className="button"
              onClick={() => setGroupBy("post")}
              style={{
                opacity: groupBy === "post" ? 1 : 0.7,
                fontWeight: groupBy === "post" ? 700 : 500,
                background: groupBy === "post" ? colors.primarySoft : colors.bg,
                color: colors.text,
                border: `1px solid ${
                  groupBy === "post" ? colors.selectedBorder : colors.border
                }`,
                borderRadius: 999,
              }}
            >
              Post
            </button>

            <button
              type="button"
              className="button"
              onClick={() => setGroupBy("toestel")}
              style={{
                opacity: groupBy === "toestel" ? 1 : 0.7,
                fontWeight: groupBy === "toestel" ? 700 : 500,
                background: groupBy === "toestel" ? colors.primarySoft : colors.bg,
                color: colors.text,
                border: `1px solid ${
                  groupBy === "toestel" ? colors.selectedBorder : colors.border
                }`,
                borderRadius: 999,
              }}
            >
              Toestel
            </button>
          </div>
        </div>

        {data ? (
          <div style={compactStatsGridStyle}>
            {statCards.map((card) => (
              <div key={card.label} style={compactStatCardStyle}>
                <div style={compactStatLabelStyle}>{card.label}</div>
                <div style={compactStatValueStyle}>{card.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {data?.result.debug_counts ? (
          <div style={compactStatsGridStyle}>
            {Object.entries(data.result.debug_counts).map(([key, value]) => (
              <div key={key} style={compactStatCardStyle}>
                <div style={compactStatLabelStyle}>{key}</div>
                <div style={compactStatValueStyle}>{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          {[
            { key: "planning", label: "Planning" },
            { key: "starturen", label: "Starturen" },
            { key: "capaciteit", label: "Capaciteit" },
            { key: "conflicten", label: "Conflicten" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? colors.primarySoft : colors.bg,
                  color: colors.text,
                  border: `1px solid ${
                    isActive ? colors.selectedBorder : colors.border
                  }`,
                  borderRadius: 999,
                  padding: "10px 14px",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {activeTab === "planning" ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: selectedRow
                    ? "minmax(0, 2fr) minmax(340px, 1fr)"
                    : "1fr",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                <PlannerGantt
                  rows={previewRows}
                  postColors={postColors}
                  selectedPlanningId={selectedPlanningId}
                  onSelectPlanningId={setSelectedPlanningId}
                  groupBy={groupBy}
                  onMoveTaskToPost={(planningId, targetPost) => {
                    const row = previewRows.find((item) => item["Planning ID"] === planningId);
                    if (!row) return;
                    if (row.Post === targetPost) return;
                    if (row.Locked === true) return;

                    applyPostOverride(planningId, targetPost);
                  }}
                  onMoveTaskToDay={handleMoveTaskToDay}
                  onMoveTaskAfterTask={async (planningId, targetPlanningId) => {
                    const row = previewRows.find((item) => item["Planning ID"] === planningId);
                    const targetRow = previewRows.find(
                      (item) => item["Planning ID"] === targetPlanningId
                    );

                    if (!row || !targetRow) return;
                    if (row.Locked === true) return;
                    if (targetRow.Locked === true) return;
                    if (row.Werkdag_iso !== targetRow.Werkdag_iso) return;

                    if (row.Post !== targetRow.Post && targetRow.Post) {
                      await applyPostOverride(planningId, targetRow.Post);
                    }

                    await applyTaskReorder(planningId, targetPlanningId);
                  }}
                />

                {selectedPlanningId && (
                  <div
                    style={{
                      position: "fixed",
                      bottom: 24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "white",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: "10px 14px",
                      display: "flex",
                      gap: 10,
                      boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
                      zIndex: 2000,
                    }}
                  >
                    <button
                      className="button"
                      onClick={() => {
                        const row = previewRows.find(
                          (r) => r["Planning ID"] === selectedPlanningId
                        );
                        if (!row) return;

                        setTaskLock(selectedPlanningId, !row.Locked);
                      }}
                    >
                      🔒{" "}
                      {previewRows.find((r) => r["Planning ID"] === selectedPlanningId)
                        ?.Locked
                        ? "Unlock"
                        : "Lock"}
                    </button>

                    <button
                      className="button"
                      onClick={() => {
                        clearTaskOverride(selectedPlanningId);
                      }}
                    >
                      ♻ Reset
                    </button>

                    <button className="button" onClick={() => setSelectedPlanningId(null)}>
                      ✕
                    </button>
                  </div>
                )}

                {selectedRow ? (
                  <div
                    style={{
                      ...cardStyle,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      position: "sticky",
                      top: 24,
                    }}
                  >
                    <div>
                      <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>
                        Geselecteerde taak
                      </h3>

                      {isSelectedLocked ? (
                        <div
                          style={{
                            background: colors.lockedBg,
                            color: "#9a6700",
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-block",
                            marginTop: 10,
                          }}
                        >
                          🔒 Deze taak is vastgezet
                        </div>
                      ) : null}

                      <p
                        style={{
                          margin: "10px 0 0 0",
                          color: colors.textMuted,
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        Detail en explainability van de geselecteerde planner-row.
                      </p>
                    </div>

                    <div
                      style={{
                        border: `1px solid ${colors.primaryLight}`,
                        borderRadius: 16,
                        padding: 14,
                        background: colors.primarySoft,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>
                        OVERRIDES
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={labelStyle}>Override werkdag</div>
                          <select
                            style={inputStyle}
                            value={overrideWorkday}
                            onChange={(e) => setOverrideWorkday(e.target.value)}
                          >
                            <option value="">Kies werkdag</option>
                            {workdays.map((day) => (
                              <option key={day} value={day}>
                                {formatIsoDate(day)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div style={labelStyle}>Override post</div>
                          <select
                            style={inputStyle}
                            value={overridePost}
                            onChange={(e) => setOverridePost(e.target.value)}
                          >
                            <option value="">Kies post</option>
                            {posts.map((post) => (
                              <option key={post} value={post}>
                                {post}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {selectedPlanningId ? (
                          <button
                            type="button"
                            className="button"
                            onClick={() =>
                              applyWorkdayOverride(selectedPlanningId, overrideWorkday)
                            }
                            disabled={loading || !overrideWorkday}
                            style={{
                              background: colors.primary,
                              color: colors.text,
                              border: "none",
                              borderRadius: 12,
                              fontWeight: 700,
                            }}
                          >
                            {loading ? "Bezig..." : "Dag opslaan"}
                          </button>
                        ) : null}

                        {selectedPlanningId ? (
                          <button
                            type="button"
                            className="button"
                            onClick={() => applyPostOverride(selectedPlanningId, overridePost)}
                            disabled={loading || !overridePost}
                            style={{
                              background: colors.primary,
                              color: colors.text,
                              border: "none",
                              borderRadius: 12,
                              fontWeight: 700,
                            }}
                          >
                            {loading ? "Bezig..." : "Post opslaan"}
                          </button>
                        ) : null}

                        {selectedPlanningId ? (
                          <button
                            type="button"
                            className="button"
                            onClick={() => {
                              if (isSelectedLocked) {
                                const ok = window.confirm("Deze taak is vastgezet. Vrijgeven?");
                                if (!ok) return;
                                applyTaskLock(selectedPlanningId, false);
                              } else {
                                applyTaskLock(selectedPlanningId, true);
                              }
                            }}
                            disabled={loading}
                            style={{
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 12,
                              fontWeight: 700,
                            }}
                          >
                            {loading ? "Bezig..." : isSelectedLocked ? "Vrijgeven" : "Lock taak"}
                          </button>
                        ) : null}

                        {selectedPlanningId ? (
                          <button
                            type="button"
                            className="button"
                            onClick={() => {
                              const ok = window.confirm("Alle overrides voor deze taak verwijderen?");
                              if (!ok) return;
                              applyResetOverride(selectedPlanningId);
                            }}
                            disabled={loading}
                            style={{
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 12,
                            }}
                          >
                            {loading ? "Bezig..." : "Reset override"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 10,
                      }}
                    >
                      {[
                        ["Recept", selectedRow.Recept || "-"],
                        ["Prognose aantal", selectedRow["Prognose aantal"] ?? "-"],
                        ["Menu-groep", selectedRow["Menu-groep"] || "-"],
                        ["Periode naam", selectedRow["Periode naam"] || "-"],
                        ["Taak", selectedRow.Taak || "-"],
                        ["Werkdag", selectedRow.Werkdag || "-"],
                        ["Post", selectedRow.Post || "-"],
                        ["Toestel", selectedRow.Toestel || "-"],
                        ["Timing", `${selectedRow.Start || "-"} → ${selectedRow.Einde || "-"}`],
                        ["Actieve tijd", formatMinutes(selectedRow["Actieve tijd"] as number | null)],
                        ["Passieve tijd", formatMinutes(selectedRow["Passieve tijd"] as number | null)],
                        ["Totale duur", formatMinutes(selectedRow["Totale duur"] as number | null)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            border: `1px solid ${colors.border}`,
                            borderRadius: 14,
                            background: colors.bg,
                            padding: 12,
                          }}
                        >
                          <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>
                            {label}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight: 700,
                              color: colors.text,
                              lineHeight: 1.4,
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          border: `1px solid ${colors.border}`,
                          borderRadius: 16,
                          background: "#f8fbff",
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>
                          SNEL VERPLAATSEN NAAR WERKDAG
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {availableWorkdaysForMove.length === 0 ? (
                            <span style={{ fontSize: 13, color: colors.textMuted }}>
                              Geen andere werkdagen beschikbaar.
                            </span>
                          ) : (
                            availableWorkdaysForMove.map((day) => (
                              <button
                                key={day}
                                type="button"
                                className="button"
                                onClick={() =>
                                  selectedPlanningId && applyWorkdayOverride(selectedPlanningId, day)
                                }
                                disabled={loading || isSelectedLocked}
                                style={{
                                  opacity: loading || isSelectedLocked ? 0.6 : 1,
                                  cursor:
                                    loading || isSelectedLocked ? "not-allowed" : "pointer",
                                  background: colors.primary,
                                  color: colors.text,
                                  border: "none",
                                  borderRadius: 999,
                                  fontWeight: 700,
                                }}
                              >
                                {formatIsoDate(day)}
                              </button>
                            ))
                          )}
                        </div>

                        {isSelectedLocked ? (
                          <div style={{ fontSize: 12, color: "#9a6700", fontWeight: 700 }}>
                            Deze taak is vastgezet en kan niet naar een andere dag verplaatst worden.
                          </div>
                        ) : null}
                      </div>

                      {selectedRow["Toestel conflict"] ? (
                        <div
                          style={{
                            border: `1px solid ${colors.danger}`,
                            borderRadius: 16,
                            background: colors.conflictBg,
                            padding: 14,
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#9f1d1d", fontWeight: 700 }}>
                            TOESTELCONFLICT
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight: 700,
                              color: "#9f1d1d",
                              lineHeight: 1.5,
                            }}
                          >
                            {selectedRow["Conflict details"] || "Conflict gedetecteerd"}
                          </div>
                        </div>
                      ) : null}

                      {!isBreakRow(selectedRow) ? (
                        <>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <h3 style={{ ...sectionTitleStyle, fontSize: 18 }}>
                              Planner explainability
                            </h3>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                                gap: 8,
                              }}
                            >
                              {[
                                ["Voorkeur offset", String(selectedRow["Voorkeur offset"] ?? "-")],
                                ["Min offset", String(selectedRow["Min offset"] ?? "-")],
                                ["Max offset", String(selectedRow["Max offset"] ?? "-")],
                                ["Gekozen offset", String(selectedRow["Gekozen offset"] ?? "-")],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  style={{
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 10,
                                    background: colors.bg,
                                    padding: "8px 10px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: colors.textMuted,
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.4,
                                    }}
                                  >
                                    {label}
                                  </div>

                                  <div
                                    style={{
                                      marginTop: 2,
                                      fontWeight: 700,
                                      color: colors.text,
                                      fontSize: 18,
                                    }}
                                  >
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {[
                            ["Planner reden", selectedRow["Planner reden"] || "-"],
                            ["Planner score", selectedRow["Planner score"] || "-"],
                            ["Kandidaatdagen", selectedRow["Planner kandidaatdagen"] || "-"],
                            ["Stappen", selectedRow.Stappen || "-"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: 10,
                                background: colors.bg,
                                padding: "8px 10px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 10,
                                  color: colors.textMuted,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  opacity: 0.7,
                                }}
                              >
                                {label}
                              </div>
                              <div
                                style={{
                                  marginTop: 4,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  fontSize: 12,
                                  lineHeight: 1.4,
                                  color: colors.text,
                                  fontWeight: 500,
                                }}
                              >
                                {value}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  ...cardStyle,
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: colors.bg,
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Werkdag",
                          "Start",
                          "Einde",
                          "Post",
                          "Toestel",
                          "Conflict",
                          "Menu-groep",
                          "Recept",
                          "Prognose",
                          "Taak",
                          "Totale duur",
                          "Planner reden",
                        ].map((label) => (
                          <th
                            key={label}
                            style={{
                              textAlign: "left",
                              padding: 14,
                              borderBottom: `1px solid ${colors.border}`,
                              position: "sticky",
                              top: 0,
                              background: colors.bgMuted,
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: colors.textMuted,
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => {
                        const isSelected = row["Planning ID"] === selectedPlanningId;
                        const isBreak = isBreakRow(row);
                        const hasConflict = row["Toestel conflict"] === true;

                        return (
                          <tr
                            key={row["Planning ID"] ?? `${row.Werkdag_iso}-${row.Post}-${row.Start}-${row.Taak}`}
                            onClick={() =>
                              setSelectedPlanningId((prev) =>
                                prev === row["Planning ID"] ? null : (row["Planning ID"] as string)
                              )
                            }
                            style={{
                              cursor: "pointer",
                              background: isSelected
                                ? colors.selectedBg
                                : hasConflict
                                ? "#fff7f7"
                                : isBreak
                                ? colors.bgMuted
                                : colors.bg,
                            }}
                          >
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.Werkdag}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.Start}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.Einde}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.Post}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.Toestel}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {hasConflict ? (
                                <span
                                  style={{
                                    background: colors.conflictBg,
                                    color: "#9f1d1d",
                                    padding: "4px 8px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  Conflict
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row["Menu-groep"] || "-"}
                            </td>
                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #f0f0f0",
                                minWidth: 240,
                                fontWeight: 600,
                              }}
                            >
                              {row.Recept}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row["Prognose aantal"] ?? "-"}
                            </td>
                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #f0f0f0",
                                minWidth: 220,
                              }}
                            >
                              {row.Taak}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {formatMinutes(row["Totale duur"] as number | null)}
                            </td>
                            <td
                              style={{
                                padding: 14,
                                borderBottom: "1px solid #f0f0f0",
                                minWidth: 260,
                                color: colors.textMuted,
                              }}
                            >
                              {row["Planner reden"]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {previewRows.length === 0 ? (
                <div
                  style={{
                    ...cardStyle,
                    padding: 16,
                    color: colors.textMuted,
                  }}
                >
                  Geen rows voor deze filters.
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "starturen" ? (
            <div
              style={{
                ...cardStyle,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>Post starturen</h3>
                <p style={{ margin: "8px 0 0 0", color: colors.textMuted, fontSize: 14 }}>
                  Stel per werkdag en post het startuur in dat de planner moet gebruiken.
                </p>
              </div>

              {visiblePlanningStarturen.length === 0 ? (
                <div style={{ color: colors.textMuted }}>
                  Nog geen starturen gevonden. Draai eerst een planner run.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: colors.bg,
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr>
                        {["Werkdag", "Post", "Startuur", "Actie"].map((label) => (
                          <th
                            key={label}
                            style={{
                              textAlign: "left",
                              padding: 14,
                              borderBottom: `1px solid ${colors.border}`,
                              background: colors.bgMuted,
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: colors.textMuted,
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlanningStarturen.map((row) => {
                        const key = `${row.werkdag}|${row.post}`;
                        const isSaving = savingStartuurKey === key;

                        return (
                          <tr key={key}>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {formatIsoDate(row.werkdag)}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              {row.post}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              <input
                                type="time"
                                value={row.starttijd || "08:00"}
                                onChange={(e) =>
                                  updatePlanningStartuurLocal(row.werkdag, row.post, e.target.value)
                                }
                                style={{
                                  ...inputStyle,
                                  maxWidth: 140,
                                  padding: "10px 12px",
                                }}
                              />
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                              <button
                                type="button"
                                className="button"
                                onClick={() =>
                                  savePlanningStartuur(row.werkdag, row.post, row.starttijd)
                                }
                                disabled={isSaving}
                                style={{
                                  background: colors.primary,
                                  color: colors.text,
                                  border: "none",
                                  borderRadius: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {isSaving ? "Opslaan..." : "Opslaan"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "capaciteit" ? (
            <div
              style={{
                ...cardStyle,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>Capaciteit per post</h3>
                <p style={{ margin: "8px 0 0 0", color: colors.textMuted, fontSize: 14 }}>
                  Geplande minuten versus capaciteit per werkdag en post.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: colors.bg,
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Werkdag",
                        "Post",
                        "Geplande minuten",
                        "Capaciteit minuten",
                        "Belasting",
                        "Status",
                      ].map((label) => (
                        <th
                          key={label}
                          style={{
                            textAlign: "left",
                            padding: 14,
                            borderBottom: `1px solid ${colors.border}`,
                            background: colors.bgMuted,
                            whiteSpace: "nowrap",
                            fontSize: 12,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: colors.textMuted,
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCapacityRows.map((row) => (
                      <tr key={`${row.Werkdag_iso}-${row.Post}`}>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row.Werkdag}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row.Post}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {formatMinutes(row["Geplande minuten"])}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {formatMinutes(row["Capaciteit minuten"])}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row["Belasting pct"] == null ? "-" : `${row["Belasting pct"]}%`}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          <span
                            style={{
                              ...statusStyle(row.Status),
                              padding: "4px 8px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {row.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCapacityRows.length === 0 ? (
                <div style={{ color: colors.textMuted }}>Geen capaciteitsdata voor deze filters.</div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "conflicten" ? (
            <div
              style={{
                ...cardStyle,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>Toestelconflicten</h3>
                <p style={{ margin: "8px 0 0 0", color: colors.textMuted, fontSize: 14 }}>
                  Overlappende taken op hetzelfde toestel.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: colors.bg,
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {["Werkdag", "Toestel", "Taak A", "Taak B", "Periode A", "Periode B"].map(
                        (label) => (
                          <th
                            key={label}
                            style={{
                              textAlign: "left",
                              padding: 14,
                              borderBottom: `1px solid ${colors.border}`,
                              background: colors.bgMuted,
                              whiteSpace: "nowrap",
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: colors.textMuted,
                            }}
                          >
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConflictRows.map((row, idx) => (
                      <tr key={`${row["Planning ID A"]}-${row["Planning ID B"]}-${idx}`}>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {formatIsoDate(row.Werkdag_iso)}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row.Toestel}
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row["Taak A"]} ({row["Post A"]})
                        </td>
                        <td style={{ padding: 14, borderBottom: "1px solid #f0f0f0" }}>
                          {row["Taak B"]} ({row["Post B"]})
                        </td>
                        <td
                          style={{
                            padding: 14,
                            borderBottom: "1px solid #f0f0f0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row["Start A"]} → {row["Einde A"]}
                        </td>
                        <td
                          style={{
                            padding: 14,
                            borderBottom: "1px solid #f0f0f0",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row["Start B"]} → {row["Einde B"]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredConflictRows.length === 0 ? (
                <div style={{ color: colors.textMuted }}>Geen toestelconflicten voor deze filters.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
