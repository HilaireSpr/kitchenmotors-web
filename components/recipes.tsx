"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type ImportResult = {
  recepten?: number;
  handelingen?: number;
  stappen?: number;
};

type RecipeListItem = {
  recept_id: number;
  recept_code: string;
  recept_naam: string;
  categorie: string;
};

type RecipeStep = {
  stap_id: number;
  stap_volgorde: number;
  stap_naam: string;
  stap_tijd: number;
};

type RecipeHandeling = {
  handeling_id: number;
  handeling_code: string;
  handeling_naam: string;
  subgroep_code: string | null;
  volgorde_handeling: number;
  post: string;
  toestel: string;
  dag_offset: number;
  dag_offset_min: number;
  dag_offset_max: number;
  passieve_tijd: number;
  actieve_tijd: number;
  totale_duur: number;
  is_vaste_taak: boolean;
  heeft_vast_startuur: boolean;
  vast_startuur: string;
  stappen: RecipeStep[];
};

type RecipeDetail = {
  recept_id: number;
  recept_code: string;
  recept_naam: string;
  categorie: string;
  handelingen: RecipeHandeling[];
};

type HandelingFormState = {
  naam: string;
  post: string;
  toestel: string;
  dag_offset: string;
  dag_offset_min: string;
  dag_offset_max: string;
  passieve_tijd: number;
  is_vaste_taak: boolean;
  heeft_vast_startuur: boolean;
  vast_startuur: string;
};

type StapFormState = {
  naam: string;
  tijd: number;
};

function createEmptyHandelingForm(): HandelingFormState {
  return {
    naam: "",
    post: "",
    toestel: "",
    dag_offset: "0",
    dag_offset_min: "0",
    dag_offset_max: "0",
    passieve_tijd: 0,
    is_vaste_taak: false,
    heeft_vast_startuur: false,
    vast_startuur: "",
  };
}

function createEmptyStapForm(): StapFormState {
  return {
    naam: "",
    tijd: 0,
  };
}

function isValidIntegerInput(value: string) {
  return /^-?\d*$/.test(value);
}

function parseIntegerString(value: string, fallback = 0) {
  if (value.trim() === "" || value.trim() === "-") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const cardStyle = {
  border: `1px solid ${colors.border}`,
  background: colors.bg,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
};

const labelTextStyle = {
  fontSize: 12,
  color: colors.textMuted,
};

export default function ImportRecipes() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const [editingHandelingId, setEditingHandelingId] = useState<number | null>(null);
  const [savingHandelingId, setSavingHandelingId] = useState<number | null>(null);
  const [openHandelingIds, setOpenHandelingIds] = useState<number[]>([]);
  const [handelingForm, setHandelingForm] = useState<HandelingFormState>(
    createEmptyHandelingForm()
  );

  const [editingStapId, setEditingStapId] = useState<number | null>(null);
  const [savingStapId, setSavingStapId] = useState<number | null>(null);
  const [stapForm, setStapForm] = useState<StapFormState>(createEmptyStapForm());

  async function loadRecipes() {
    try {
      const res = await fetch(`${API_URL}/api/v1/recipes`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json();
      setRecipes(json.result ?? []);
      setOpenCategories([]);
    } catch (err) {
      console.error("Fout bij ophalen receptenlijst:", err);
      setRecipes([]);
    }
  }

  async function loadRecipeDetail(receptCode: string, resetEditState = true) {
    try {
      const res = await fetch(`${API_URL}/api/v1/recipes/${receptCode}`);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json();
      setRecipeDetail(json.result ?? null);

      if (resetEditState) {
        setOpenHandelingIds([]);
        setEditingHandelingId(null);
        setEditingStapId(null);
        setHandelingForm(createEmptyHandelingForm());
        setStapForm(createEmptyStapForm());
      }
    } catch (err) {
      console.error("Fout bij ophalen receptdetail:", err);
      setRecipeDetail(null);
    }
  }

  async function reloadSelectedRecipeDetail() {
    if (!selectedRecipe) return;
    await loadRecipeDetail(selectedRecipe, false);
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/v1/import/recipes-excel`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json();
      setResult(json.result ?? null);
      await loadRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij upload");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  function startEditHandeling(handeling: RecipeHandeling) {
    setEditingHandelingId(handeling.handeling_id);
    setEditingStapId(null);
    setHandelingForm({
      naam: handeling.handeling_naam || "",
      post: handeling.post || "",
      toestel: handeling.toestel || "",
      dag_offset: String(handeling.dag_offset ?? 0),
      dag_offset_min: String(handeling.dag_offset_min ?? handeling.dag_offset ?? 0),
      dag_offset_max: String(handeling.dag_offset_max ?? handeling.dag_offset ?? 0),
      passieve_tijd: handeling.passieve_tijd ?? 0,
      is_vaste_taak: handeling.is_vaste_taak ?? false,
      heeft_vast_startuur: handeling.heeft_vast_startuur ?? false,
      vast_startuur: handeling.vast_startuur ?? "",
    });
  }

  function cancelEditHandeling() {
    setEditingHandelingId(null);
    setHandelingForm(createEmptyHandelingForm());
  }

  function toggleHandelingOpen(handelingId: number) {
    setOpenHandelingIds((prev) =>
      prev.includes(handelingId)
        ? prev.filter((id) => id !== handelingId)
        : [...prev, handelingId]
    );
  }

  function startEditStap(stap: RecipeStep) {
    setEditingStapId(stap.stap_id);
    setEditingHandelingId(null);
    setStapForm({
      naam: stap.stap_naam || "",
      tijd: stap.stap_tijd ?? 0,
    });
  }

  function cancelEditStap() {
    setEditingStapId(null);
    setStapForm(createEmptyStapForm());
  }

  function closeRecipeDetail() {
    setSelectedRecipe(null);
    setRecipeDetail(null);
    setOpenHandelingIds([]);
    setEditingHandelingId(null);
    setEditingStapId(null);
    setHandelingForm(createEmptyHandelingForm());
    setStapForm(createEmptyStapForm());
  }

  async function saveStap(stapId: number) {
    try {
      setSavingStapId(stapId);
      setError("");

      const payload = {
        naam: stapForm.naam,
        tijd: Number(stapForm.tijd) || 0,
      };

      const res = await fetch(`${API_URL}/api/v1/recipes/stappen/${stapId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await reloadSelectedRecipeDetail();
      cancelEditStap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij opslaan stap");
    } finally {
      setSavingStapId(null);
    }
  }

  async function saveHandeling(handelingId: number) {
    try {
      setSavingHandelingId(handelingId);
      setError("");

      const dagOffset = parseIntegerString(handelingForm.dag_offset, 0);
      const dagOffsetMin = parseIntegerString(handelingForm.dag_offset_min, 0);
      const dagOffsetMax = parseIntegerString(handelingForm.dag_offset_max, 0);

      const payload = {
        naam: handelingForm.naam,
        handeling_naam: handelingForm.naam,

        post: handelingForm.post,
        toestel: handelingForm.toestel,

        dag_offset: dagOffset,
        min_offset_dagen: dagOffsetMin,
        max_offset_dagen: dagOffsetMax,

        passieve_tijd: Number(handelingForm.passieve_tijd) || 0,

        is_vaste_taak: handelingForm.is_vaste_taak,
        heeft_vast_startuur: handelingForm.heeft_vast_startuur,
        vast_startuur: handelingForm.heeft_vast_startuur
          ? handelingForm.vast_startuur
          : "",
      };

      const res = await fetch(`${API_URL}/api/v1/recipes/handelingen/${handelingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      await reloadSelectedRecipeDetail();
      cancelEditHandeling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij opslaan handeling");
    } finally {
      setSavingHandelingId(null);
    }
  }

  const recipesByCategory = useMemo(() => {
    const map = new Map<string, RecipeListItem[]>();

    for (const recipe of recipes) {
      const category = recipe.categorie?.trim() || "Zonder categorie";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(recipe);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => a.recept_code.localeCompare(b.recept_code)),
      }));
  }, [recipes]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ margin: 0 }}>Recepten</h2>
          <p style={{ margin: 0, color: colors.textMuted }}>
            Beheer en controleer je recepten, handelingen en stappen. Import via Excel
            blijft beschikbaar onderaan.
          </p>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: colors.conflictBg,
            border: `1px solid ${colors.danger}`,
            color: colors.text,
          }}
        >
          Fout: {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 360px) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          className="card"
          style={{
            ...cardStyle,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "sticky",
            top: 16,
            alignSelf: "start",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h3 style={{ margin: 0 }}>Receptgroepen</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
              Geïmporteerde recepten, gegroepeerd per categorie.
            </p>
          </div>

          {recipesByCategory.length === 0 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: colors.bgMuted,
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              Nog geen recepten gevonden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recipesByCategory.map(({ category, items }) => {
                const isOpen = openCategories.includes(category);

                return (
                  <div
                    key={category}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      background: colors.bg,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        padding: 10,
                        background: colors.bgMuted,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{category}</div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            color: colors.textMuted,
                          }}
                        >
                          {items.length} recepten
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 18,
                          fontWeight: 700,
                          color: colors.textMuted,
                          lineHeight: 1,
                          minWidth: 24,
                          flexShrink: 0,
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </button>
                    </div>

                    {isOpen ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 8 }}>
                        {items.map((recipe) => (
                          <button
                            key={recipe.recept_code}
                            type="button"
                            onClick={() => {
                              if (selectedRecipe === recipe.recept_code) {
                                closeRecipeDetail();
                                return;
                              }

                              setSelectedRecipe(recipe.recept_code);
                              loadRecipeDetail(recipe.recept_code);
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              textAlign: "left",
                              padding: 10,
                              borderRadius: 10,
                              border: `1px solid ${colors.border}`,
                              background:
                                selectedRecipe === recipe.recept_code
                                  ? colors.selectedBg
                                  : colors.bg,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {recipe.recept_code}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>
                              {recipe.recept_naam}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ ...cardStyle, padding: 16, minHeight: 420 }}>
          {!recipeDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h3 style={{ margin: 0 }}>Receptdetail</h3>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                Selecteer links een recept om details te bekijken en aan te passen.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3 style={{ margin: 0 }}>
                    {recipeDetail.recept_code} — {recipeDetail.recept_naam}
                  </h3>
                  <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                    Categorie: {recipeDetail.categorie || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  className="button"
                  onClick={closeRecipeDetail}
                  style={{
                    background: colors.bgMuted,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Sluiten
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <SummaryCard label="Handelingen" value={recipeDetail.handelingen.length} />
                <SummaryCard
                  label="Totale actieve tijd"
                  value={`${recipeDetail.handelingen.reduce(
                    (sum, h) => sum + (h.actieve_tijd ?? 0),
                    0
                  )} min`}
                />
                <SummaryCard
                  label="Totale passieve tijd"
                  value={`${recipeDetail.handelingen.reduce(
                    (sum, h) => sum + (h.passieve_tijd ?? 0),
                    0
                  )} min`}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recipeDetail.handelingen.map((handeling) => {
                  const isOpen = openHandelingIds.includes(handeling.handeling_id);
                  const isEditing = editingHandelingId === handeling.handeling_id;
                  const isSaving = savingHandelingId === handeling.handeling_id;

                  return (
                    <div
                      key={handeling.handeling_id}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                        padding: 14,
                        background: colors.bg,
                      }}
                    >
                      <div
                        onClick={() => toggleHandelingOpen(handeling.handeling_id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          marginBottom: isOpen ? 10 : 0,
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {handeling.handeling_code} — {handeling.handeling_naam}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: colors.textMuted,
                            }}
                          >
                            Subgroep: {handeling.subgroep_code || "-"} | Volgorde:{" "}
                            {handeling.volgorde_handeling}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: colors.textMuted,
                              lineHeight: 1,
                            }}
                          >
                            {isOpen ? "−" : "+"}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: colors.textMuted,
                              textAlign: "right",
                            }}
                          >
                            <div>Post: {handeling.post || "-"}</div>
                            <div>Toestel: {handeling.toestel || "-"}</div>
                          </div>

                          <button
                            type="button"
                            className="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditHandeling(handeling);
                              if (!isOpen) {
                                toggleHandelingOpen(handeling.handeling_id);
                              }
                            }}
                            style={{
                              background: isEditing ? colors.bgMuted : colors.primary,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {isEditing ? "Bezig met bewerken" : "Bewerken"}
                          </button>
                        </div>
                      </div>

                      {isOpen ? (
                        <>
                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                                marginBottom: 12,
                                padding: 14,
                                borderRadius: 12,
                                background: colors.primarySoft,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                  gap: 12,
                                }}
                              >
                                <TextInput
                                  label="Handeling naam"
                                  value={handelingForm.naam}
                                  onChange={(value) =>
                                    setHandelingForm((prev) => ({ ...prev, naam: value }))
                                  }
                                />

                                <TextInput
                                  label="Post"
                                  value={handelingForm.post}
                                  onChange={(value) =>
                                    setHandelingForm((prev) => ({ ...prev, post: value }))
                                  }
                                />

                                <TextInput
                                  label="Toestel"
                                  value={handelingForm.toestel}
                                  onChange={(value) =>
                                    setHandelingForm((prev) => ({ ...prev, toestel: value }))
                                  }
                                />
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(220px, 1.2fr) minmax(0, 1fr)",
                                  gap: 12,
                                  alignItems: "start",
                                }}
                              >
                                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <span style={labelTextStyle}>
                                    Voorkeursdag t.o.v. serveerdag
                                  </span>
                                  <input
                                    type="number"
                                    value={handelingForm.dag_offset}
                                    onChange={(e) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        dag_offset: e.target.value,
                                      }))
                                    }
                                    style={inputStyle}
                                  />
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: colors.textMuted,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    0 = serveerdag, -1 = dag ervoor, -7 = een week ervoor
                                  </span>
                                </label>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    gap: 12,
                                  }}
                                >
                                  <IntegerInput
                                    label="Vroegste dag"
                                    value={handelingForm.dag_offset_min}
                                    onChange={(value) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        dag_offset_min: value,
                                      }))
                                    }
                                  />

                                  <IntegerInput
                                    label="Laatste dag"
                                    value={handelingForm.dag_offset_max}
                                    onChange={(value) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        dag_offset_max: value,
                                      }))
                                    }
                                  />

                                  <NumberInput
                                    label="Passieve tijd"
                                    value={handelingForm.passieve_tijd}
                                    onChange={(value) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        passieve_tijd: value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                  gap: 12,
                                  alignItems: "end",
                                }}
                              >
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minHeight: 42,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={handelingForm.is_vaste_taak}
                                    onChange={(e) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        is_vaste_taak: e.target.checked,
                                      }))
                                    }
                                  />
                                  <span style={{ fontSize: 14, color: colors.text }}>
                                    Vaste taak
                                  </span>
                                </label>

                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minHeight: 42,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={handelingForm.heeft_vast_startuur}
                                    onChange={(e) =>
                                      setHandelingForm((prev) => ({
                                        ...prev,
                                        heeft_vast_startuur: e.target.checked,
                                        vast_startuur: e.target.checked
                                          ? prev.vast_startuur || "08:00"
                                          : "",
                                      }))
                                    }
                                  />
                                  <span style={{ fontSize: 14, color: colors.text }}>
                                    Vast startuur
                                  </span>
                                </label>

                                {handelingForm.heeft_vast_startuur ? (
                                  <label
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    <span style={labelTextStyle}>Startuur</span>
                                    <input
                                      type="time"
                                      value={handelingForm.vast_startuur}
                                      onChange={(e) =>
                                        setHandelingForm((prev) => ({
                                          ...prev,
                                          vast_startuur: e.target.value,
                                        }))
                                      }
                                      style={inputStyle}
                                    />
                                  </label>
                                ) : (
                                  <div />
                                )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  className="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveHandeling(handeling.handeling_id);
                                  }}
                                  disabled={isSaving}
                                  style={{
                                    background: colors.primary,
                                    color: colors.text,
                                  }}
                                >
                                  {isSaving ? "Opslaan..." : "Opslaan"}
                                </button>

                                <button
                                  type="button"
                                  className="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditHandeling();
                                  }}
                                  disabled={isSaving}
                                  style={{
                                    background: colors.bgMuted,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                  }}
                                >
                                  Annuleren
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <HandelingStats handeling={handeling} />

                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: colors.textMuted,
                              }}
                            >
                              Stappen
                            </div>

                            {handeling.stappen.length === 0 ? (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: colors.textMuted,
                                  fontStyle: "italic",
                                }}
                              >
                                Geen stappen gevonden.
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {handeling.stappen.map((step) => {
                                  const isEditingStep = editingStapId === step.stap_id;
                                  const isSavingStep = savingStapId === step.stap_id;

                                  return (
                                    <div
                                      key={step.stap_id}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "60px 1fr 120px",
                                        gap: 10,
                                        alignItems: "start",
                                        padding: 10,
                                        borderRadius: 8,
                                        background: colors.bgMuted,
                                      }}
                                    >
                                      {isEditingStep ? (
                                        <>
                                          <div style={{ fontWeight: 700 }}>
                                            {step.stap_volgorde}
                                          </div>

                                          <input
                                            value={stapForm.naam}
                                            onChange={(e) =>
                                              setStapForm((prev) => ({
                                                ...prev,
                                                naam: e.target.value,
                                              }))
                                            }
                                            style={{
                                              ...inputStyle,
                                              padding: "6px 8px",
                                              borderRadius: 6,
                                            }}
                                          />

                                          <div
                                            style={{
                                              display: "flex",
                                              gap: 6,
                                              justifyContent: "flex-end",
                                              alignItems: "center",
                                            }}
                                          >
                                            <input
                                              type="number"
                                              value={stapForm.tijd}
                                              onChange={(e) =>
                                                setStapForm((prev) => ({
                                                  ...prev,
                                                  tijd: Number(e.target.value),
                                                }))
                                              }
                                              style={{
                                                width: 60,
                                                padding: "6px 6px",
                                                borderRadius: 6,
                                                border: `1px solid ${colors.border}`,
                                                background: colors.bg,
                                                color: colors.text,
                                              }}
                                            />

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                saveStap(step.stap_id);
                                              }}
                                              disabled={isSavingStep}
                                              title="Opslaan"
                                            >
                                              {isSavingStep ? "..." : "💾"}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                cancelEditStap();
                                              }}
                                              disabled={isSavingStep}
                                              title="Annuleren"
                                            >
                                              ✖
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div style={{ fontWeight: 700 }}>
                                            {step.stap_volgorde}
                                          </div>

                                          <div>{step.stap_naam}</div>

                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "flex-end",
                                              gap: 8,
                                              alignItems: "center",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontWeight: 700,
                                                color: colors.textMuted,
                                              }}
                                            >
                                              {step.stap_tijd} min
                                            </span>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                startEditStap(step);
                                              }}
                                              style={{ fontSize: 12 }}
                                            >
                                              ✏️
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{ margin: 0 }}>Import recepten (Excel)</h3>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
            Upload een Excelbestand volgens de KitchenMotors-template.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{
              padding: 8,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              background: colors.bg,
              color: colors.text,
            }}
          />

          <button
            className="button"
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              background: colors.primary,
              color: colors.text,
              opacity: loading || !file ? 0.7 : 1,
            }}
          >
            {loading ? "Upload bezig..." : "Upload Excel"}
          </button>
        </div>

        {file ? (
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            Gekozen bestand: <strong>{file.name}</strong>
          </p>
        ) : null}

        {result ? (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <SummaryCard label="Recepten" value={result.recepten ?? 0} />
            <SummaryCard label="Handelingen" value={result.handelingen ?? 0} />
            <SummaryCard label="Stappen" value={result.stappen ?? 0} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="card"
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.bgMuted,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelTextStyle}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </label>
  );
}

function IntegerInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelTextStyle}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={labelTextStyle}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    </label>
  );
}

function HandelingStats({ handeling }: { handeling: RecipeHandeling }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <SmallStat
        label="Toegelaten venster"
        value={`${handeling.dag_offset_min} → ${handeling.dag_offset_max}`}
        subValue={`Voorkeur: ${handeling.dag_offset}`}
      />
      <SmallStat label="Actieve tijd" value={`${handeling.actieve_tijd} min`} />
      <SmallStat label="Passieve tijd" value={`${handeling.passieve_tijd} min`} />
      <SmallStat label="Totale duur" value={`${handeling.totale_duur} min`} />
      <SmallStat
        label="Vast startuur"
        value={
          handeling.heeft_vast_startuur
            ? handeling.vast_startuur || "-"
            : "Nee"
        }
      />
    </div>
  );
}

function SmallStat({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string | number;
  subValue?: string;
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        background: colors.bgMuted,
      }}
    >
      <div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
      {subValue ? (
        <div
          style={{
            fontSize: 11,
            color: colors.textMuted,
            marginTop: 4,
          }}
        >
          {subValue}
        </div>
      ) : null}
    </div>
  );
}