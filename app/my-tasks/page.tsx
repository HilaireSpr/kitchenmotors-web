"use client";

import { useEffect, useState } from "react";

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

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [userId, setUserId] = useState("AD8");
  const [workDate, setWorkDate] = useState("2026-04-06");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8010/api/v1";

  async function fetchTasks() {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/workfloor/my-tasks/today?user_id=${userId}&work_date=${workDate}`
      );

      const data = await res.json();

      const visibleTasks = (data.tasks || []).filter(
        (task: Task) => !task.title.toLowerCase().includes("pauze")
      );

      const sorted = visibleTasks.sort((a: Task, b: Task) => {
        return (
          new Date(a.start || "").getTime() -
          new Date(b.start || "").getTime()
        );
      });

      setTasks(sorted);
    } catch (err) {
      console.error("Fout bij ophalen taken:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [userId, workDate]);

  async function completeTask(taskId: string) {
    setSavingTaskId(taskId);

    try {
      const res = await fetch(
        `${API_URL}/workfloor/tasks/${encodeURIComponent(taskId)}/complete`,
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
        throw new Error("Taak kon niet worden afgevinkt.");
      }

      setTasks((prev) => {
        const updated = prev.filter((task) => task.id !== taskId);

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);

        return updated;
      });
    } catch (err) {
      console.error("Fout bij afvinken taak:", err);
      alert("Taak kon niet worden afgevinkt.");
    } finally {
      setSavingTaskId(null);
    }
  }

  function formatTime(value?: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value.slice(11, 16);
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

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <p>Laden...</p>
      </main>
    );
  }

  const currentTask = tasks[0];
  const nextTasks = tasks.slice(1);

  const nextInSameHandeling = currentTask
    ? nextTasks.find((task) => task.handeling === currentTask.handeling)
    : null;

  const currentSteps = splitSteps(currentTask?.stappen);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        background: "#fffdf7",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 30, margin: 0 }}>Mijn taken vandaag</h1>

          <p style={{ marginTop: 8, color: "#666", fontSize: 16 }}>
            Post {userId} • {workDate}
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 16,
              }}
            >
              <option value="AD8">AD8</option>
              <option value="AA9">AA9</option>
              <option value="AD8R">AD8R</option>
              <option value="C8">C8</option>
            </select>

            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 16,
              }}
            />
          </div>
        </div>

        {!currentTask && <p>Alle taken zijn afgewerkt.</p>}

        {currentTask && (
          <section style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#7a5b00",
                textTransform: "uppercase",
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              Huidige handeling
            </div>

            <div
              style={{
                padding: 20,
                border: "2px solid #f0c94d",
                borderRadius: 20,
                background: "#fff7d6",
                boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 15,
                    color: "#7a5b00",
                    fontWeight: 800,
                  }}
                >
                  {currentTask.handeling || "Handeling"}
                </div>

                {currentTask.recept && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      color: "#666",
                    }}
                  >
                    {currentTask.recept}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="checkbox"
                  checked={false}
                  disabled={savingTaskId === currentTask.id}
                  onChange={() => completeTask(currentTask.id)}
                  style={{
                    width: 32,
                    height: 32,
                    marginTop: 4,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 25,
                      fontWeight: 850,
                      lineHeight: 1.2,
                    }}
                  >
                    {currentTask.title}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#555",
                      }}
                    >
                      {formatTime(currentTask.start)} –{" "}
                      {formatTime(currentTask.end)}
                    </span>

                    {currentTask.toestel && (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: "#fff",
                          border: "1px solid #e5dfcf",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {currentTask.toestel}
                      </span>
                    )}
                  </div>

                  {nextInSameHandeling && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 14,
                        color: "#7a5b00",
                        fontWeight: 700,
                      }}
                    >
                      Hierna binnen deze handeling: {nextInSameHandeling.title}
                    </div>
                  )}

                  {!nextInSameHandeling && nextTasks[0] && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 14,
                        color: "#7a5b00",
                        fontWeight: 700,
                      }}
                    >
                      Volgende handeling:{" "}
                      {nextTasks[0].handeling || nextTasks[0].title}
                    </div>
                  )}

                  {currentSteps.length > 0 && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 14,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.7)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#7a5b00",
                          marginBottom: 8,
                        }}
                      >
                        Stappen
                      </div>

                      <ol
                        style={{
                          margin: 0,
                          paddingLeft: 20,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        {currentSteps.map((step, index) => (
                          <li key={`${currentTask.id}-step-${index}`}>
                            {step.replace(/^\d+\.\s*/, "")}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 14,
                      color: "#7a5b00",
                      fontWeight: 700,
                    }}
                  >
                    Vink af wanneer deze taak volledig klaar is.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {nextTasks.length > 0 && (
          <section>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#666",
                textTransform: "uppercase",
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              Volgende taken
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {nextTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 16,
                    border: "1px solid #e5dfcf",
                    borderRadius: 16,
                    background: "white",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={savingTaskId === task.id}
                    onChange={() => completeTask(task.id)}
                    style={{
                      width: 22,
                      height: 22,
                      marginTop: 4,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {task.handeling && (
                        <span style={{ color: "#7a5b00" }}>
                          {task.handeling} •{" "}
                        </span>
                      )}
                      {task.title}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        color: "#666",
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        {formatTime(task.start)} – {formatTime(task.end)}
                      </span>

                      {task.toestel && <span>• {task.toestel}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}