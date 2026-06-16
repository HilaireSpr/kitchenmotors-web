"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.235:8000";

type Task = {
  id: string;
  title: string;
  post?: string;
  recept?: string;
  handeling_id?: string | number | null;
  handeling?: string;
  toestel?: string | null;
  stappen?: string;
  start?: string;
  end?: string;
};

const POSTEN = ["FOOD", "PAT", "REF", "SOEP"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16) || value;
  }

  return date.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitSteps(stappen?: string) {
  if (!stappen) return [];

  return stappen
    .split("|")
    .map((step) => step.trim())
    .filter(Boolean);
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [userId, setUserId] = useState("FOOD");
  const [workDate, setWorkDate] = useState(todayIso());
  const [error, setError] = useState("");

  async function fetchTasks() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/v1/workfloor/my-tasks/today?user_id=${encodeURIComponent(
          userId
        )}&work_date=${encodeURIComponent(workDate)}`
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Taken konden niet worden opgehaald.");
      }

      const data = await res.json();

      const visibleTasks = (data.tasks || []).filter(
        (task: Task) => !String(task.title || "").toLowerCase().includes("pauze")
      );

      const sorted = visibleTasks.sort((a: Task, b: Task) => {
        return (
          new Date(a.start || "").getTime() -
          new Date(b.start || "").getTime()
        );
      });

      setTasks(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij ophalen taken");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get("user_id");
    const urlDate = params.get("work_date");

    if (urlUserId) setUserId(urlUserId);
    if (urlDate) setWorkDate(urlDate);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [userId, workDate]);

  async function completeTask(taskId: string) {
    setSavingTaskId(taskId);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/v1/workfloor/tasks/${encodeURIComponent(taskId)}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Taak kon niet worden afgevinkt.");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Taak kon niet worden afgevinkt.");
    } finally {
      setSavingTaskId(null);
    }
  }

  const currentTask = tasks[0];
  const nextTasks = tasks.slice(1);

  const currentSteps = useMemo(
    () => splitSteps(currentTask?.stappen),
    [currentTask]
  );

  const nextInSameHandeling = currentTask
    ? nextTasks.find((task) => task.handeling === currentTask.handeling)
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bgMuted,
        padding: 14,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 14,
            boxShadow: "0 8px 24px rgba(17,17,17,0.05)",
          }}
        >
          <img
            src="/kitchenmotors-logo.png"
            alt="KitchenMotors"
            style={{
              width: "100%",
              maxWidth: 320,
              height: "auto",
              display: "block",
              marginBottom: 12,
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.1,
              color: colors.text,
            }}
          >
            Mijn taken
          </h1>

          <p
            style={{
              margin: "6px 0 0 0",
              color: colors.textMuted,
              fontSize: 15,
            }}
          >
            Werkvloerweergave voor post {userId}
          </p>

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: colors.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              Pilotpartner
            </div>

            <img
              src="/customer-logos/ZOL-logo.png"
              alt="Ziekenhuis Oost-Limburg"
              style={{
                maxWidth: 180,
                width: "55%",
                height: "auto",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 14,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                Post
              </span>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {POSTEN.map((post) => (
                  <option key={post} value={post}>
                    {post}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
                Datum
              </span>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              />
            </label>
          </div>
        </header>

        {error ? (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: colors.conflictBg,
              border: `1px solid ${colors.danger}`,
              color: colors.text,
              marginBottom: 14,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              padding: 22,
              borderRadius: 18,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              fontWeight: 700,
            }}
          >
            Taken laden...
          </div>
        ) : null}

        {!loading && !currentTask ? (
          <div
            style={{
              padding: 28,
              borderRadius: 22,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 8 }}>✅</div>
            <h2 style={{ margin: 0, color: colors.text }}>Alle taken zijn klaar</h2>
            <p style={{ margin: "8px 0 0 0", color: colors.textMuted }}>
              Voor {userId} op {workDate} staan geen open taken meer.
            </p>
          </div>
        ) : null}

        {currentTask ? (
          <section style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: colors.primary,
                textTransform: "uppercase",
                marginBottom: 8,
                letterSpacing: "0.06em",
              }}
            >
              Nu uitvoeren
            </div>

            <div
              style={{
                padding: 20,
                border: `2px solid ${colors.primary}`,
                borderRadius: 24,
                background: colors.primarySoft,
                boxShadow: "0 12px 28px rgba(17,17,17,0.08)",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: colors.textMuted, fontWeight: 800 }}>
                  {currentTask.handeling || "Handeling"}
                </div>

                <h2
                  style={{
                    margin: "5px 0 0 0",
                    fontSize: 27,
                    lineHeight: 1.15,
                    color: colors.text,
                  }}
                >
                  {currentTask.title}
                </h2>

                {currentTask.recept ? (
                  <div style={{ marginTop: 6, color: colors.textMuted, fontSize: 15 }}>
                    {currentTask.recept}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <Badge>
                  {formatTime(currentTask.start)} – {formatTime(currentTask.end)}
                </Badge>

                {currentTask.toestel ? <Badge>{currentTask.toestel}</Badge> : null}
                {currentTask.post ? <Badge>{currentTask.post}</Badge> : null}
              </div>

              {currentSteps.length > 0 ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.75)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      color: colors.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    Stappen
                  </div>

                  <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
                    {currentSteps.map((step, index) => (
                      <li key={`${currentTask.id}-step-${index}`}>
                        {step.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {nextInSameHandeling ? (
                <div
                  style={{
                    marginTop: 14,
                    color: colors.textMuted,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Hierna binnen dezelfde handeling: {nextInSameHandeling.title}
                </div>
              ) : nextTasks[0] ? (
                <div
                  style={{
                    marginTop: 14,
                    color: colors.textMuted,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Volgende handeling: {nextTasks[0].handeling || nextTasks[0].title}
                </div>
              ) : null}

              <button
                type="button"
                disabled={savingTaskId === currentTask.id}
                onClick={() => completeTask(currentTask.id)}
                style={{
                  width: "100%",
                  marginTop: 18,
                  padding: "16px 18px",
                  borderRadius: 16,
                  border: "none",
                  background: colors.primary,
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: savingTaskId === currentTask.id ? "not-allowed" : "pointer",
                  opacity: savingTaskId === currentTask.id ? 0.7 : 1,
                }}
              >
                {savingTaskId === currentTask.id ? "Afvinken..." : "Taak afgewerkt"}
              </button>
            </div>
          </section>
        ) : null}

        {nextTasks.length > 0 ? (
          <section>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: colors.textMuted,
                textTransform: "uppercase",
                marginBottom: 8,
                letterSpacing: "0.06em",
              }}
            >
              Volgende taken ({nextTasks.length})
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {nextTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 850, color: colors.text }}>
                    {task.handeling ? (
                      <span style={{ color: colors.primary }}>{task.handeling} • </span>
                    ) : null}
                    {task.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      color: colors.textMuted,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <span>{formatTime(task.start)} – {formatTime(task.end)}</span>
                    {task.toestel ? <span>• {task.toestel}</span> : null}
                    {task.post ? <span>• {task.post}</span> : null}
                  </div>

                  <button
                    type="button"
                    disabled={savingTaskId === task.id}
                    onClick={() => completeTask(task.id)}
                    style={{
                      justifySelf: "start",
                      marginTop: 4,
                      padding: "9px 12px",
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      background: colors.bgMuted,
                      color: colors.text,
                      fontWeight: 800,
                      cursor: savingTaskId === task.id ? "not-allowed" : "pointer",
                    }}
                  >
                    Afvinken
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: 13,
        fontWeight: 800,
        color: colors.text,
      }}
    >
      {children}
    </span>
  );
}