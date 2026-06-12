"use client";

import { useEffect, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type BaseDataItem = {
  id: number;
  naam: string;
  kleur?: string | null;
  capaciteit_minuten?: number | null;
  startuur?: string | null;
  actief_maandag?: number | null;
  actief_dinsdag?: number | null;
  actief_woensdag?: number | null;
  actief_donderdag?: number | null;
  actief_vrijdag?: number | null;
  actief_zaterdag?: number | null;
  actief_zondag?: number | null;
};

type BaseDataSection = "posten" | "toestellen";

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
};

const weekdayFields = [
  ["actief_maandag", "Ma"],
  ["actief_dinsdag", "Di"],
  ["actief_woensdag", "Wo"],
  ["actief_donderdag", "Do"],
  ["actief_vrijdag", "Vr"],
  ["actief_zaterdag", "Za"],
  ["actief_zondag", "Zo"],
] as const;

export default function BaseData() {
  const [posten, setPosten] = useState<BaseDataItem[]>([]);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostName, setEditPostName] = useState("");
  const [editPostColor, setEditPostColor] = useState("#dbeafe");
  const [editPostCapacity, setEditPostCapacity] = useState(480);
  const [editPostStartuur, setEditPostStartuur] = useState("08:00");
  const [editPostActiveDays, setEditPostActiveDays] = useState({
    actief_maandag: 1,
    actief_dinsdag: 1,
    actief_woensdag: 1,
    actief_donderdag: 1,
    actief_vrijdag: 1,
    actief_zaterdag: 1,
    actief_zondag: 1,
  });
  const [toestellen, setToestellen] = useState<BaseDataItem[]>([]);

  const [newPost, setNewPost] = useState("");
  const [newPostColor, setNewPostColor] = useState("#dbeafe");
  const [newPostCapacity, setNewPostCapacity] = useState(480);
  const [newPostStartuur, setNewPostStartuur] = useState("08:00");
  const [newPostActiveDays, setNewPostActiveDays] = useState({
    actief_maandag: 1,
    actief_dinsdag: 1,
    actief_woensdag: 1,
    actief_donderdag: 1,
    actief_vrijdag: 1,
    actief_zaterdag: 1,
    actief_zondag: 1,
  });

  const [newToestel, setNewToestel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<BaseDataSection>("posten");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [postRes, toestelRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/base-data/posten`),
        fetch(`${API_URL}/api/v1/base-data/toestellen`),
      ]);

      if (!postRes.ok) {
        throw new Error("Basisdata kan nog niet geladen worden. De API is nog niet verbonden.");
      }

      if (!toestelRes.ok) {
        throw new Error("Toestellen kunnen nog niet geladen worden. De API is nog niet verbonden.");
      }

      const postJson = await postRes.json();
      const toestelJson = await toestelRes.json();

      setPosten(Array.isArray(postJson.result) ? postJson.result : []);
      setToestellen(Array.isArray(toestelJson.result) ? toestelJson.result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij laden basisdata");
      setPosten([]);
      setToestellen([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function resetPlanningStarturen() {
    const confirmed = window.confirm(
      "Weet je zeker dat je alle planning-starturen wilt resetten? Bij de volgende planner run worden ze opnieuw opgebouwd uit de standaard starturen van de posten."
    );

    if (!confirmed) return;

    try {
      setError("");

      const res = await fetch(`${API_URL}/api/v1/base-data/planning-starturen/reset`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Planning-starturen resetten mislukt: ${text}`);
      }

      alert("Planning-starturen zijn gereset. Maak nu een nieuwe planner run.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fout bij resetten planning-starturen"
      );
    }
  }

  async function addPost() {
    if (!newPost.trim()) return;

    try {
      setError("");

      const res = await fetch(`${API_URL}/api/v1/base-data/posten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          naam: newPost.trim(),
          kleur: newPostColor,
          capaciteit_minuten: newPostCapacity,
          startuur: newPostStartuur,
          ...newPostActiveDays,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Post toevoegen mislukt: ${text}`);
      }

      setNewPost("");
      setNewPostColor("#dbeafe");
      setNewPostCapacity(480);
      setNewPostStartuur("08:00");
      setNewPostActiveDays({
        actief_maandag: 1,
        actief_dinsdag: 1,
        actief_woensdag: 1,
        actief_donderdag: 1,
        actief_vrijdag: 1,
        actief_zaterdag: 1,
        actief_zondag: 1,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij toevoegen post");
    }
  }

  async function deletePost(id: number) {
    try {
      setError("");

      const res = await fetch(`${API_URL}/api/v1/base-data/posten/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Post verwijderen mislukt: ${text}`);
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij verwijderen post");
    }
  }

  async function updatePost(id: number) {
    try {
      setError("");

      const res = await fetch(
        `${API_URL}/api/v1/base-data/posten/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            naam: editPostName,
            kleur: editPostColor,
            capaciteit_minuten: editPostCapacity,
            startuur: editPostStartuur,
            ...editPostActiveDays,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Post aanpassen mislukt: ${text}`);
      }

      setEditingPostId(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fout bij aanpassen post"
      );
    }
  }

  async function addToestel() {
    if (!newToestel.trim()) return;

    try {
      setError("");

      const res = await fetch(`${API_URL}/api/v1/base-data/toestellen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ naam: newToestel.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Toestel toevoegen mislukt: ${text}`);
      }

      setNewToestel("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij toevoegen toestel");
    }
  }

  async function deleteToestel(id: number) {
    try {
      setError("");

      const res = await fetch(`${API_URL}/api/v1/base-data/toestellen/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Toestel verwijderen mislukt: ${text}`);
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij verwijderen toestel");
    }
  }

  return (
    <div
      className="stack"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        className="card stack"
        style={{
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0 }}>Basisdata</h2>
          <p style={{ margin: 0, color: colors.textMuted }}>
            Beheer hier de vaste keukeninstellingen zoals posten en toestellen.
          </p>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fff1f1",
            border: "1px solid #ef9a9a",
            color: "crimson",
          }}
        >
          Fout: {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          className="card stack"
          style={{
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            padding: 16,
            gap: 12,
            position: "sticky",
            top: 16,
            alignSelf: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h3 style={{ margin: 0 }}>Categorieën</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
              Kies links welke basisdata je wilt beheren.
            </p>
          </div>

          <button
            type="button"
            className="button"
            onClick={() => setActiveSection("posten")}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background:
                activeSection === "posten" ? colors.selectedBg : colors.bgMuted,
              color: colors.text,
              fontWeight: activeSection === "posten" ? 700 : 500,
            }}
          >
            <div>Posten</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              {posten.length} items
            </div>
          </button>

          <button
            type="button"
            className="button"
            onClick={() => setActiveSection("toestellen")}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background:
                activeSection === "toestellen" ? colors.selectedBg : colors.bgMuted,
              color: colors.text,
              fontWeight: activeSection === "toestellen" ? 700 : 500,
            }}
          >
            <div>Toestellen</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              {toestellen.length} items
            </div>
          </button>
        </div>

        <div
          className="card stack"
          style={{
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            padding: 16,
            minHeight: 420,
            gap: 16,
          }}
        >
          {activeSection === "posten" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 style={{ margin: 0 }}>Posten</h3>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                  Voeg keukenposten toe en geef elke post een kleur en capaciteit.
                </p>
              </div>

              <button
                type="button"
                className="button"
                onClick={resetPlanningStarturen}
                style={{
                  background: colors.bgMuted,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  width: "fit-content",
                }}
              >
                Reset planning-starturen
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1fr) 64px 140px 130px auto",
                  gap: 8,
                  alignItems: "end",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                    Naam
                  </div>
                  <input
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Nieuwe post"
                    style={{
                      ...inputStyle,
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                    Kleur
                  </div>
                  <input
                    type="color"
                    value={newPostColor}
                    onChange={(e) => setNewPostColor(e.target.value)}
                    title="Postkleur"
                    style={{
                      width: "100%",
                      height: 39,
                      padding: 4,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                    Capaciteit
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={newPostCapacity}
                    onChange={(e) => setNewPostCapacity(Number(e.target.value))}
                    title="Capaciteit minuten"
                    style={{
                      ...inputStyle,
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                    Startuur
                  </div>
                  <input
                    type="time"
                    value={newPostStartuur}
                    onChange={(e) => setNewPostStartuur(e.target.value)}
                    title="Startuur"
                    style={{
                      ...inputStyle,
                      width: "100%",
                    }}
                  />
                </div>

                <button
                  className="button"
                  onClick={addPost}
                  style={{
                    background: colors.primary,
                    color: colors.text,
                    height: 39,
                  }}
                >
                  Toevoegen
                </button>
              </div>

              {loading ? (
                <div style={{ color: colors.textMuted, fontSize: 14 }}>Laden...</div>
              ) : posten.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: colors.bgMuted,
                    color: colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  Nog geen posten gevonden.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {posten.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        background: colors.bgMuted,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            background: post.kleur || "#dbeafe",
                            border: `1px solid ${colors.border}`,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />

                        {editingPostId === post.id ? (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <input
                              value={editPostName}
                              onChange={(e) => setEditPostName(e.target.value)}
                              style={inputStyle}
                            />

                            <input
                              type="color"
                              value={editPostColor}
                              onChange={(e) => setEditPostColor(e.target.value)}
                            />

                            <input
                              type="number"
                              value={editPostCapacity}
                              onChange={(e) =>
                                setEditPostCapacity(Number(e.target.value))
                              }
                              style={{
                                ...inputStyle,
                                width: 100,
                              }}
                            />

                            <input
                              type="time"
                              value={editPostStartuur}
                              onChange={(e) => setEditPostStartuur(e.target.value)}
                              style={{
                                ...inputStyle,
                                width: 120,
                              }}
                            />

                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {weekdayFields.map(([field, label]) => (
                                <label key={field} style={{ fontSize: 12 }}>
                                  <input
                                    type="checkbox"
                                    checked={editPostActiveDays[field] === 1}
                                    onChange={(e) =>
                                      setEditPostActiveDays((prev) => ({
                                        ...prev,
                                        [field]: e.target.checked ? 1 : 0,
                                      }))
                                    }
                                  />{" "}
                                  {label}
                                </label>
                              ))}
                            </div>

                            <button
                              className="button"
                              onClick={() => updatePost(post.id)}
                            >
                              Opslaan
                            </button>

                            <button
                              className="button"
                              onClick={() => setEditingPostId(null)}
                            >
                              Annuleren
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {post.naam}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color: colors.textMuted,
                                marginTop: 2,
                              }}
                            >
                              Capaciteit: {post.capaciteit_minuten ?? 480} min · Startuur: {post.startuur || "08:00"} · Actief:{" "}
                              {weekdayFields
                                .filter(([field]) => (post[field] ?? 1) === 1)
                                .map(([, label]) => label)
                                .join(", ")}
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          className="button"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditPostName(post.naam);
                            setEditPostColor(post.kleur || "#dbeafe");
                            setEditPostCapacity(post.capaciteit_minuten || 480);
                            setEditPostStartuur(post.startuur || "08:00");
                            setEditPostActiveDays({
                              actief_maandag: post.actief_maandag ?? 1,
                              actief_dinsdag: post.actief_dinsdag ?? 1,
                              actief_woensdag: post.actief_woensdag ?? 1,
                              actief_donderdag: post.actief_donderdag ?? 1,
                              actief_vrijdag: post.actief_vrijdag ?? 1,
                              actief_zaterdag: post.actief_zaterdag ?? 1,
                              actief_zondag: post.actief_zondag ?? 1,
                            });
                          }}
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          Bewerken
                        </button>

                        <button
                          type="button"
                          className="button"
                          onClick={() => deletePost(post.id)}
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          Verwijderen
                        </button>
                      </div>                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {activeSection === "toestellen" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 style={{ margin: 0 }}>Toestellen</h3>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                  Voeg hier toestellen toe en verwijder ze indien nodig.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  value={newToestel}
                  onChange={(e) => setNewToestel(e.target.value)}
                  placeholder="Nieuw toestel"
                  style={{
                    ...inputStyle,
                    flex: 1,
                    minWidth: 220,
                  }}
                />

                <button
                  className="button"
                  onClick={addToestel}
                  style={{
                    background: colors.primary,
                    color: colors.text,
                  }}
                >
                  Toevoegen
                </button>
              </div>

              {loading ? (
                <div style={{ color: colors.textMuted, fontSize: 14 }}>Laden...</div>
              ) : toestellen.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: colors.bgMuted,
                    color: colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  Nog geen toestellen gevonden.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {toestellen.map((toestel) => (
                    <div
                      key={toestel.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        background: colors.bgMuted,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{toestel.naam}</div>

                      <button
                        type="button"
                        className="button"
                        onClick={() => deleteToestel(toestel.id)}
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}