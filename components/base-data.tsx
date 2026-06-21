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
  planning_fase?: number | null;
  actief_maandag?: number | null;
  actief_dinsdag?: number | null;
  actief_woensdag?: number | null;
  actief_donderdag?: number | null;
  actief_vrijdag?: number | null;
  actief_zaterdag?: number | null;
  actief_zondag?: number | null;
};

type BaseDataSection = "posten" | "toestellen";

type PostWerkurenDag = {
  cyclus_week: number;
  weekdag: number;
  actief: boolean;
  startuur: string | null;
  einduur: string | null;
};

type PostWerkurenState = {
  post_id: number;
  post_naam?: string;
  cyclus_weken: number;
  cyclus_startdatum: string | null;
  dagen: PostWerkurenDag[];
};

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

const weekdayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function createDefaultWerkurenDays(cyclusWeken: number): PostWerkurenDag[] {
  const dagen: PostWerkurenDag[] = [];

  for (let cyclusWeek = 1; cyclusWeek <= cyclusWeken; cyclusWeek += 1) {
    for (let weekdag = 0; weekdag <= 6; weekdag += 1) {
      dagen.push({
        cyclus_week: cyclusWeek,
        weekdag,
        actief: weekdag <= 4,
        startuur: weekdag <= 4 ? "08:00" : null,
        einduur: weekdag <= 4 ? "16:00" : null,
      });
    }
  }

  return dagen;
}

export default function BaseData() {
  const [posten, setPosten] = useState<BaseDataItem[]>([]);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingWerkurenPostId, setEditingWerkurenPostId] = useState<number | null>(null);
  const [werkuren, setWerkuren] = useState<PostWerkurenState | null>(null);
  const [werkurenSaving, setWerkurenSaving] = useState(false);
  const [editPostName, setEditPostName] = useState("");
  const [editPostColor, setEditPostColor] = useState("#dbeafe");
  const [editPostCapacity, setEditPostCapacity] = useState(480);
  const [editPostStartuur, setEditPostStartuur] = useState("08:00");
  const [editPostPlanningFase, setEditPostPlanningFase] = useState(100);
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
  const [newPostPlanningFase, setNewPostPlanningFase] = useState(100);
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
          planning_fase: newPostPlanningFase,
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
            planning_fase: editPostPlanningFase,
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

  async function loadPostWerkuren(post: BaseDataItem) {
    try {
      setError("");
      setEditingWerkurenPostId(post.id);

      const res = await fetch(`${API_URL}/api/v1/base-data/posten/${post.id}/werkuren`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Postwerkuren laden mislukt: ${text}`);
      }

      const json = await res.json();

      const cyclusWeken = json.cyclus_weken || 1;
      const bestaandeDagen = Array.isArray(json.dagen) ? json.dagen : [];
      const fallbackDagen = createDefaultWerkurenDays(cyclusWeken);

      setWerkuren({
        post_id: post.id,
        post_naam: post.naam,
        cyclus_weken: cyclusWeken,
        cyclus_startdatum: json.cyclus_startdatum || null,
        dagen: fallbackDagen.map((fallbackDag) => {
          const bestaandeDag = bestaandeDagen.find(
            (dag: PostWerkurenDag) =>
              dag.cyclus_week === fallbackDag.cyclus_week &&
              dag.weekdag === fallbackDag.weekdag
          );

          return bestaandeDag
            ? {
                cyclus_week: bestaandeDag.cyclus_week,
                weekdag: bestaandeDag.weekdag,
                actief: Boolean(bestaandeDag.actief),
                startuur: bestaandeDag.startuur,
                einduur: bestaandeDag.einduur,
              }
            : fallbackDag;
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij laden postwerkuren");
    }
  }

  function updateWerkurenDag(
    cyclusWeek: number,
    weekdag: number,
    patch: Partial<PostWerkurenDag>
  ) {
    setWerkuren((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        dagen: prev.dagen.map((dag) =>
          dag.cyclus_week === cyclusWeek && dag.weekdag === weekdag
            ? { ...dag, ...patch }
            : dag
        ),
      };
    });
  }

  function updateWerkurenCyclus(cyclusWeken: number) {
    setWerkuren((prev) => {
      if (!prev) return prev;

      const nieuweDagen = createDefaultWerkurenDays(cyclusWeken);

      return {
        ...prev,
        cyclus_weken: cyclusWeken,
        dagen: nieuweDagen.map((nieuweDag) => {
          const bestaandeDag = prev.dagen.find(
            (dag) =>
              dag.cyclus_week === nieuweDag.cyclus_week &&
              dag.weekdag === nieuweDag.weekdag
          );

          return bestaandeDag || nieuweDag;
        }),
      };
    });
  }

  async function saveWerkuren() {
    if (!werkuren) return;

    try {
      setWerkurenSaving(true);
      setError("");

      const res = await fetch(
        `${API_URL}/api/v1/base-data/posten/${werkuren.post_id}/werkuren`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cyclus_weken: werkuren.cyclus_weken,
            cyclus_startdatum: werkuren.cyclus_startdatum,
            dagen: werkuren.dagen,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Postwerkuren opslaan mislukt: ${text}`);
      }

      const json = await res.json();

      setWerkuren({
        post_id: json.post_id,
        post_naam: json.post_naam,
        cyclus_weken: json.cyclus_weken || 1,
        cyclus_startdatum: json.cyclus_startdatum || null,
        dagen: Array.isArray(json.dagen) ? json.dagen.map((dag: PostWerkurenDag) => ({
          cyclus_week: dag.cyclus_week,
          weekdag: dag.weekdag,
          actief: Boolean(dag.actief),
          startuur: dag.startuur,
          einduur: dag.einduur,
        })) : [],
      });

      alert("Postwerkuren opgeslagen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij opslaan postwerkuren");
    } finally {
      setWerkurenSaving(false);
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
                    Prioriteit
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={newPostPlanningFase}
                    onChange={(e) => setNewPostPlanningFase(Number(e.target.value))}
                    title="Prioriteit: lager nummer = vroeger behandeld door de planner"
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

              {werkuren && editingWerkurenPostId ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgMuted,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Postwerkuren: {werkuren.post_naam}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      Stel hier in wanneer deze productiepost beschikbaar is.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "end",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        Cyclus
                      </span>
                      <select
                        value={werkuren.cyclus_weken}
                        onChange={(e) => updateWerkurenCyclus(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={1}>1 week</option>
                        <option value={2}>2 weken</option>
                        <option value={3}>3 weken</option>
                        <option value={4}>4 weken</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      className="button"
                      onClick={saveWerkuren}
                      disabled={werkurenSaving}
                      style={{
                        background: colors.primary,
                        color: colors.text,
                      }}
                    >
                      {werkurenSaving ? "Opslaan..." : "Werkuren opslaan"}
                    </button>

                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setEditingWerkurenPostId(null);
                        setWerkuren(null);
                      }}
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      Sluiten
                    </button>
                  </div>

                  {Array.from({ length: werkuren.cyclus_weken }, (_, index) => index + 1).map(
                    (cyclusWeek) => (
                      <div
                        key={cyclusWeek}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          padding: 10,
                          borderRadius: 10,
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>Week {cyclusWeek}</div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "80px 90px 130px 130px",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Dag</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Actief</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Startuur</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Einduur</div>

                          {weekdayNames.map((label, weekdag) => {
                            const dag = werkuren.dagen.find(
                              (item) =>
                                item.cyclus_week === cyclusWeek && item.weekdag === weekdag
                            );

                            if (!dag) return null;

                            return (
                              <div
                                key={`${cyclusWeek}-${weekdag}`}
                                style={{
                                  display: "contents",
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>{label}</div>

                                <label style={{ fontSize: 13 }}>
                                  <input
                                    type="checkbox"
                                    checked={dag.actief}
                                    onChange={(e) =>
                                      updateWerkurenDag(cyclusWeek, weekdag, {
                                        actief: e.target.checked,
                                        startuur: e.target.checked ? dag.startuur || "08:00" : null,
                                        einduur: e.target.checked ? dag.einduur || "16:00" : null,
                                      })
                                    }
                                  />{" "}
                                  actief
                                </label>

                                <input
                                  type="time"
                                  value={dag.startuur || ""}
                                  disabled={!dag.actief}
                                  onChange={(e) =>
                                    updateWerkurenDag(cyclusWeek, weekdag, {
                                      startuur: e.target.value || null,
                                    })
                                  }
                                  style={{
                                    ...inputStyle,
                                    opacity: dag.actief ? 1 : 0.5,
                                  }}
                                />

                                <input
                                  type="time"
                                  value={dag.einduur || ""}
                                  disabled={!dag.actief}
                                  onChange={(e) =>
                                    updateWerkurenDag(cyclusWeek, weekdag, {
                                      einduur: e.target.value || null,
                                    })
                                  }
                                  style={{
                                    ...inputStyle,
                                    opacity: dag.actief ? 1 : 0.5,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : null}

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
                              type="number"
                              min={1}
                              value={editPostPlanningFase}
                              onChange={(e) => setEditPostPlanningFase(Number(e.target.value))}
                              title="Prioriteit: lager nummer = vroeger behandeld door de planner"
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
                              Capaciteit: {post.capaciteit_minuten ?? 480} min · Prioriteit: {post.planning_fase ?? 100} · Actief:{" "}
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
                          onClick={() => loadPostWerkuren(post)}
                          style={{
                            background: editingWerkurenPostId === post.id ? colors.selectedBg : colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          Werkuren
                        </button>

                        <button
                          type="button"
                          className="button"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditPostName(post.naam);
                            setEditPostColor(post.kleur || "#dbeafe");
                            setEditPostCapacity(post.capaciteit_minuten || 480);
                            setEditPostStartuur(post.startuur || "08:00");
                            setEditPostPlanningFase(post.planning_fase || 100);
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