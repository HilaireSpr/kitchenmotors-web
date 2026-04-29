"use client";

import { useEffect, useMemo, useState } from "react";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type RecipeRow = {
  id?: number;
  recept_id?: number;
  code?: string | null;
  recept_code?: string | null;
  naam?: string | null;
  recept_naam?: string | null;
  categorie?: string | null;
  menu_groep?: string | null;
  actief?: number | boolean | null;
};

type MenuItemRow = {
  id: number;
  recept_id: number;
  serveerdag: string;
  cyclus_week?: number | null;
  cyclus_dag?: number | null;
  menu_groep?: string | null;
  ritme_type?: string | null;
  ritme_interval_weken?: number | null;
  bron?: string | null;
  code?: string | null;
  naam?: string | null;
  categorie?: string | null;
  recept_menu_groep?: string | null;
};

type ApiListResponse<T> = {
  success?: boolean;
  result?: T[];
  data?: T[];
};

type HerhalingType = "single" | "daily" | "weekdays" | "custom";

const WEEKDAGEN = [
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
  "zondag",
];

const HERHALING_OPTIES: { value: HerhalingType; label: string }[] = [
  { value: "single", label: "Eén dag" },
  { value: "daily", label: "Dagelijks" },
  { value: "weekdays", label: "Weekdagen" },
  { value: "custom", label: "Aangepast" },
];

const CYCLUS_OPTIES = [
  { value: "none", label: "Geen cyclus" },
  { value: "2_weeks", label: "2 weken" },
  { value: "4_weeks", label: "4 weken" },
];

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }

  return [];
}

function getRecipeId(recipe: RecipeRow): number | null {
  return recipe.id ?? recipe.recept_id ?? null;
}

function getRecipeCode(recipe: RecipeRow): string {
  return recipe.code ?? recipe.recept_code ?? "";
}

function getRecipeNaam(recipe: RecipeRow): string {
  return recipe.naam ?? recipe.recept_naam ?? "";
}

function formatCyclus(item: MenuItemRow) {
  if (!item.ritme_type) return "Geen cyclus";
  if (item.ritme_type === "2_weeks") return "2 weken";
  if (item.ritme_type === "4_weeks") return "4 weken";
  return item.ritme_type;
}

function getCyclusDagFromServeerdag(dag: string): number | null {
  switch (dag.toLowerCase()) {
    case "maandag":
      return 1;
    case "dinsdag":
      return 2;
    case "woensdag":
      return 3;
    case "donderdag":
      return 4;
    case "vrijdag":
      return 5;
    case "zaterdag":
      return 6;
    case "zondag":
      return 7;
    default:
      return null;
  }
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
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

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: colors.text,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  marginBottom: 8,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const subtleBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

export default function MenuItems() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedMenuGroep, setSelectedMenuGroep] = useState("");
  const [isNieuweMenuGroep, setIsNieuweMenuGroep] = useState(false);
  const [nieuweMenuGroep, setNieuweMenuGroep] = useState("");

  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [serveerdag, setServeerdag] = useState("");
  const [herhalingType, setHerhalingType] = useState<HerhalingType>("single");
  const [customDagen, setCustomDagen] = useState<string[]>([]);
  const [cyclusType, setCyclusType] = useState("none");
  const [cyclusWeek, setCyclusWeek] = useState("");

  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editServeerdag, setEditServeerdag] = useState("");
  const [editCyclusWeek, setEditCyclusWeek] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [recipesRes, menuItemsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/menu/recipes`),
        fetch(`${API_URL}/api/v1/menu/items`),
      ]);

      if (!recipesRes.ok) {
        throw new Error("Kon recepten niet ophalen");
      }

      if (!menuItemsRes.ok) {
        throw new Error("Kon menu-items niet ophalen");
      }

      const recipesJson: ApiListResponse<RecipeRow> | RecipeRow[] = await recipesRes.json();
      const menuItemsJson: ApiListResponse<MenuItemRow> | MenuItemRow[] =
        await menuItemsRes.json();

      const loadedRecipes = extractArray<RecipeRow>(recipesJson);
      const loadedMenuItems = extractArray<MenuItemRow>(menuItemsJson);

      setRecipes(loadedRecipes);
      setMenuItems(loadedMenuItems);

      const groups = Array.from(
        new Set(
          loadedMenuItems
            .map((item) => item.menu_groep || item.recept_menu_groep || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      if (!activeGroup && groups.length > 0) {
        setActiveGroup(groups[0]);
      } else if (activeGroup && !groups.includes(activeGroup)) {
        setActiveGroup(groups[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
      setRecipes([]);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const bestaandeMenuGroepen = useMemo(() => {
    return Array.from(
      new Set(
        menuItems
          .map((item) => item.menu_groep || item.recept_menu_groep || "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [menuItems]);

  const gekozenMenuGroep = useMemo(() => {
    return isNieuweMenuGroep ? nieuweMenuGroep.trim() : selectedMenuGroep.trim();
  }, [isNieuweMenuGroep, nieuweMenuGroep, selectedMenuGroep]);

  const beschikbareRecipes = useMemo(() => {
    const sortedRecipes = [...recipes].sort((a, b) =>
      `${getRecipeCode(a)}${getRecipeNaam(a)}`.localeCompare(
        `${getRecipeCode(b)}${getRecipeNaam(b)}`
      )
    );

    if (!gekozenMenuGroep) {
      return sortedRecipes;
    }

    return sortedRecipes.filter((recipe) => {
      const recipeId = getRecipeId(recipe);
      if (!recipeId) return false;

      const hasDuplicate = menuItems.some((item) => {
        const itemGroup = item.menu_groep || item.recept_menu_groep || "";
        return item.recept_id === recipeId && itemGroup === gekozenMenuGroep;
      });

      return !hasDuplicate;
    });
  }, [recipes, menuItems, gekozenMenuGroep]);

  useEffect(() => {
    if (!selectedRecipeId) return;

    const exists = beschikbareRecipes.some((recipe) => {
      const recipeId = getRecipeId(recipe);
      return String(recipeId) === String(selectedRecipeId);
    });

    if (!exists) {
      setSelectedRecipeId("");
    }
  }, [beschikbareRecipes, selectedRecipeId]);

  const menuGroupsWithItems = useMemo(() => {
    const map = new Map<string, MenuItemRow[]>();

    for (const item of menuItems) {
      const group = item.menu_groep || item.recept_menu_groep || "Zonder menu-groep";

      if (!map.has(group)) {
        map.set(group, []);
      }

      map.get(group)!.push(item);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([group, items]) => ({
        group,
        items: [...items].sort((a, b) => {
          if (a.serveerdag !== b.serveerdag) {
            return WEEKDAGEN.indexOf(a.serveerdag) - WEEKDAGEN.indexOf(b.serveerdag);
          }
          return (a.cyclus_week ?? 0) - (b.cyclus_week ?? 0);
        }),
      }));
  }, [menuItems]);

  const itemsInActiveGroup = useMemo(() => {
    if (!activeGroup) return [];
    return menuItems
      .filter(
        (item) =>
          (item.menu_groep || item.recept_menu_groep || "Zonder menu-groep") === activeGroup
      )
      .sort((a, b) => {
        if (a.serveerdag !== b.serveerdag) {
          return WEEKDAGEN.indexOf(a.serveerdag) - WEEKDAGEN.indexOf(b.serveerdag);
        }
        return (a.cyclus_week ?? 0) - (b.cyclus_week ?? 0);
      });
  }, [menuItems, activeGroup]);

  function toggleGroup(group: string) {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group]
    );
  }

  function resetMenuItemForm() {
    setSelectedRecipeId("");
    setServeerdag("");
    setHerhalingType("single");
    setCustomDagen([]);
    setCyclusType("none");
    setCyclusWeek("");
    setSelectedMenuGroep("");
    setIsNieuweMenuGroep(false);
    setNieuweMenuGroep("");
  }

  function toggleCustomDag(dag: string) {
    setCustomDagen((prev) =>
      prev.includes(dag) ? prev.filter((item) => item !== dag) : [...prev, dag]
    );
  }

  function getSelectedDays(): string[] {
    if (herhalingType === "single") {
      return serveerdag ? [serveerdag] : [];
    }

    if (herhalingType === "daily") {
      return WEEKDAGEN;
    }

    if (herhalingType === "weekdays") {
      return WEEKDAGEN.slice(0, 5);
    }

    return customDagen;
  }

  async function handleCreateMenuItem() {
    const gekozenDagen = getSelectedDays();

    if (!gekozenMenuGroep) {
      setError("Kies of maak eerst een menu-groep.");
      return;
    }

    if (!selectedRecipeId) {
      setError("Kies een recept.");
      return;
    }

    if (gekozenDagen.length === 0) {
      setError("Kies minstens één dag.");
      return;
    }

    if ((cyclusType === "2_weeks" || cyclusType === "4_weeks") && !cyclusWeek) {
      setError("Kies een startweek voor deze cyclus.");
      return;
    }

    const duplicateItems = menuItems.filter((item) => {
      const itemGroup = item.menu_groep || item.recept_menu_groep || "";
      return item.recept_id === Number(selectedRecipeId) && itemGroup === gekozenMenuGroep;
    });

    if (duplicateItems.length > 0) {
      setError(`Dit recept zit al in menu-groep "${gekozenMenuGroep}".`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await Promise.all(
        gekozenDagen.map(async (dag) => {
          const cyclusDag = getCyclusDagFromServeerdag(dag);

          if (!cyclusDag) {
            throw new Error(`Ongeldige dag: ${dag}`);
          }

          const res = await fetch(`${API_URL}/api/v1/menu/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recept_id: Number(selectedRecipeId),
              serveerdag: dag,
              cyclus_week: cyclusWeek ? Number(cyclusWeek) : null,
              cyclus_dag: cyclusDag,
              menu_groep: gekozenMenuGroep,
              ritme_type: cyclusType === "none" ? null : cyclusType,
              ritme_interval_weken:
                cyclusType === "2_weeks" ? 2 : cyclusType === "4_weeks" ? 4 : null,
              bron: "manual",
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `Kon menu-item voor ${dag} niet bewaren`);
          }
        })
      );

      const nieuweGroep = gekozenMenuGroep;

      resetMenuItemForm();
      await loadData();
      setActiveGroup(nieuweGroep);
      setOpenGroups((prev) => (prev.includes(nieuweGroep) ? prev : [...prev, nieuweGroep]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon menu-item niet bewaren");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMenuItem(menuItemId: number) {
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/menu/items`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu_item_id: menuItemId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kon menu-item niet verwijderen");
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon menu-item niet verwijderen");
    }
  }

  function startEditMenuItem(item: MenuItemRow) {
    setEditingItemId(item.id);
    setEditServeerdag(item.serveerdag || "");
    setEditCyclusWeek(item.cyclus_week ? String(item.cyclus_week) : "");
  }

  function cancelEditMenuItem() {
    setEditingItemId(null);
    setEditServeerdag("");
    setEditCyclusWeek("");
  }

  async function handleUpdateMenuItem(item: MenuItemRow) {
    setError("");

    const cyclusDag = getCyclusDagFromServeerdag(editServeerdag);

    if (!editServeerdag || !cyclusDag) {
      setError("Kies een geldige serveerdag.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/menu/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serveerdag: editServeerdag,
          cyclus_week: editCyclusWeek ? Number(editCyclusWeek) : null,
          cyclus_dag: cyclusDag,
          menu_groep: item.menu_groep,
          ritme_type: item.ritme_type,
          ritme_interval_weken: item.ritme_interval_weken,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Kon menu-item niet aanpassen");
      }

      cancelEditMenuItem();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon menu-item niet aanpassen");
    }
  }

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
            <h2 style={sectionTitleStyle}>Menu opbouwen</h2>
            <p
              style={{
                margin: "8px 0 0 0",
                color: colors.textMuted,
                fontSize: 15,
                lineHeight: 1.5,
                maxWidth: 760,
              }}
            >
              Kies een menu-groep en voeg recepten toe op basis van dag, cyclus en herhaling.
              Recepten die al in dezelfde menu-groep zitten, verdwijnen automatisch uit de lijst.
            </p>
          </div>

          <div
            style={{
              ...subtleBadgeStyle,
              background: colors.primarySoft,
              color: colors.text,
              border: `1px solid ${colors.primaryLight}`,
            }}
          >
            {bestaandeMenuGroepen.length} menu-groepen
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
              value={isNieuweMenuGroep ? "__nieuw__" : selectedMenuGroep}
              onChange={(e) => {
                setError("");
                setSelectedRecipeId("");

                if (e.target.value === "__nieuw__") {
                  setIsNieuweMenuGroep(true);
                  setSelectedMenuGroep("");
                } else {
                  setIsNieuweMenuGroep(false);
                  setSelectedMenuGroep(e.target.value);
                  setNieuweMenuGroep("");
                }
              }}
              style={inputStyle}
            >
              <option value="">Kies menu-groep</option>
              {bestaandeMenuGroepen.map((groep) => (
                <option key={groep} value={groep}>
                  {groep}
                </option>
              ))}
              <option value="__nieuw__">+ Nieuwe menu-groep</option>
            </select>
          </div>

          {isNieuweMenuGroep ? (
            <div>
              <div style={labelStyle}>Nieuwe menu-groep</div>
              <input
                value={nieuweMenuGroep}
                onChange={(e) => {
                  setNieuweMenuGroep(e.target.value);
                  setError("");
                }}
                placeholder="Bijv. Zomermenu"
                style={inputStyle}
              />
            </div>
          ) : null}

          <div>
            <div style={labelStyle}>Recept</div>
            <select
              value={selectedRecipeId}
              onChange={(e) => {
                setSelectedRecipeId(e.target.value);
                setError("");
              }}
              style={inputStyle}
              disabled={!gekozenMenuGroep}
            >
              <option value="">
                {!gekozenMenuGroep ? "Kies eerst menu-groep" : "Kies recept"}
              </option>
              {beschikbareRecipes.map((recipe) => {
                const recipeId = getRecipeId(recipe);
                if (!recipeId) return null;

                const recipeCode = getRecipeCode(recipe);
                const recipeNaam = getRecipeNaam(recipe);

                return (
                  <option key={recipeId} value={recipeId}>
                    {recipeCode ? `${recipeCode} - ` : ""}
                    {recipeNaam}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Cyclus</div>
            <select
              value={cyclusType}
              onChange={(e) => {
                setCyclusType(e.target.value);
                setError("");
                if (e.target.value === "none") {
                  setCyclusWeek("");
                }
              }}
              style={inputStyle}
            >
              {CYCLUS_OPTIES.map((optie) => (
                <option key={optie.value} value={optie.value}>
                  {optie.label}
                </option>
              ))}
            </select>
          </div>

          {cyclusType === "2_weeks" || cyclusType === "4_weeks" ? (
            <div>
              <div style={labelStyle}>Startweek</div>
              <select
                value={cyclusWeek}
                onChange={(e) => {
                  setCyclusWeek(e.target.value);
                  setError("");
                }}
                style={inputStyle}
              >
                <option value="">Kies week</option>
                {cyclusType === "2_weeks" ? (
                  <>
                    <option value="1">Week 1</option>
                    <option value="2">Week 2</option>
                  </>
                ) : (
                  <>
                    <option value="1">Week 1</option>
                    <option value="2">Week 2</option>
                    <option value="3">Week 3</option>
                    <option value="4">Week 4</option>
                  </>
                )}
              </select>
            </div>
          ) : (
            <div>
              <div style={labelStyle}>Startweek</div>
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  color: colors.textMuted,
                  background: colors.bgMuted,
                }}
              >
                Niet van toepassing
              </div>
            </div>
          )}

          <div>
            <div style={labelStyle}>Herhaling</div>
            <select
              value={herhalingType}
              onChange={(e) => {
                const value = e.target.value as HerhalingType;
                setHerhalingType(value);
                setError("");

                if (value !== "single") {
                  setServeerdag("");
                }

                if (value !== "custom") {
                  setCustomDagen([]);
                }
              }}
              style={inputStyle}
            >
              {HERHALING_OPTIES.map((optie) => (
                <option key={optie.value} value={optie.value}>
                  {optie.label}
                </option>
              ))}
            </select>
          </div>

          {herhalingType === "single" ? (
            <div>
              <div style={labelStyle}>Serveerdag</div>
              <select
                value={serveerdag}
                onChange={(e) => {
                  setServeerdag(e.target.value);
                  setError("");
                }}
                style={inputStyle}
              >
                <option value="">Kies dag</option>
                {WEEKDAGEN.map((dag) => (
                  <option key={dag} value={dag}>
                    {capitalize(dag)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div style={labelStyle}>Serveerdag</div>
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  color: colors.textMuted,
                  background: colors.bgMuted,
                }}
              >
                Wordt bepaald door herhaling
              </div>
            </div>
          )}
        </div>

        {herhalingType === "daily" ? (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: colors.bgMuted,
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Deze keuze maakt automatisch items aan voor alle 7 weekdagen.
          </div>
        ) : null}

        {herhalingType === "weekdays" ? (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: colors.bgMuted,
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            Deze keuze maakt automatisch items aan voor maandag t.e.m. vrijdag.
          </div>
        ) : null}

        {herhalingType === "custom" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={labelStyle}>Kies de dagen</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {WEEKDAGEN.map((dag) => {
                const isSelected = customDagen.includes(dag);

                return (
                  <button
                    key={dag}
                    type="button"
                    className="button"
                    onClick={() => toggleCustomDag(dag)}
                    style={{
                      background: isSelected ? colors.primarySoft : colors.bg,
                      color: colors.text,
                      border: `1px solid ${
                        isSelected ? colors.selectedBorder : colors.border
                      }`,
                      fontWeight: isSelected ? 700 : 600,
                      borderRadius: 999,
                      padding: "10px 14px",
                    }}
                  >
                    {capitalize(dag)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            paddingTop: 4,
          }}
        >
          <button
            className="button"
            onClick={handleCreateMenuItem}
            disabled={saving}
            style={{
              background: colors.primary,
              color: colors.text,
              border: "none",
              opacity: saving ? 0.7 : 1,
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(255, 192, 0, 0.24)",
            }}
          >
            {saving ? "Opslaan..." : "Toevoegen aan menu"}
          </button>

          <button
            className="button"
            onClick={loadData}
            disabled={loading}
            style={{
              background: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              opacity: loading ? 0.7 : 1,
              borderRadius: 12,
              padding: "12px 18px",
              fontWeight: 600,
            }}
          >
            {loading ? "Verversen..." : "Ververs lijst"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: 18,
            position: "sticky",
            top: 24,
            alignSelf: "start",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>Menu-groepen</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14, lineHeight: 1.5 }}>
              Overzicht van alle bestaande menu-groepen en hun inhoud.
            </p>
          </div>

          {loading ? (
            <p>Bezig met laden...</p>
          ) : menuGroupsWithItems.length === 0 ? (
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: colors.bgMuted,
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              Nog geen menu-items gevonden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {menuGroupsWithItems.map(({ group, items }) => {
                const isOpen = openGroups.includes(group);
                const isActive = activeGroup === group;

                return (
                  <div
                    key={group}
                    style={{
                      border: `1px solid ${
                        isActive ? colors.selectedBorder : colors.border
                      }`,
                      borderRadius: 16,
                      background: isActive ? colors.selectedBg : colors.bg,
                      overflow: "hidden",
                      boxShadow: isActive ? "0 10px 24px rgba(255, 192, 0, 0.12)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        padding: 14,
                        background: isActive ? colors.selectedBg : colors.bgMuted,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGroup(group);
                          toggleGroup(group);
                        }}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          color: colors.text,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{group}</div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: colors.textMuted,
                          }}
                        >
                          {items.length} items
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        style={{
                          border: "none",
                          background: colors.bg,
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 700,
                          color: colors.textMuted,
                          lineHeight: 1,
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </button>
                    </div>

                    {isOpen ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          padding: 10,
                        }}
                      >
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveGroup(group)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 14,
                              border: `1px solid ${colors.border}`,
                              background: colors.bg,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {item.code ? `${item.code} - ` : ""}
                              {item.naam || "-"}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>
                              {capitalize(item.serveerdag)} • {formatCyclus(item)}
                              {item.cyclus_week ? ` • week ${item.cyclus_week}` : ""}
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

        <div
          style={{
            ...cardStyle,
            padding: 24,
            minHeight: 420,
          }}
        >
          {!activeGroup ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: 20 }}>Menu-items</h3>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                Selecteer links een menu-groep om de inhoud te bekijken.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <h3 style={{ ...sectionTitleStyle, fontSize: 22 }}>{activeGroup}</h3>
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: colors.textMuted,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    Items in deze menu-groep.
                  </p>
                </div>

                <div
                  style={{
                    ...subtleBadgeStyle,
                    background: colors.bgMuted,
                    color: colors.textMuted,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {itemsInActiveGroup.length} items
                </div>
              </div>

              {itemsInActiveGroup.length === 0 ? (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: colors.bgMuted,
                    color: colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  Geen items gevonden in deze menu-groep.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {itemsInActiveGroup.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: 18,
                        padding: 16,
                        background: colors.bg,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        boxShadow: "0 6px 18px rgba(17, 17, 17, 0.03)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            lineHeight: 1.3,
                            color: colors.text,
                          }}
                        >
                          {item.code ? `${item.code} - ` : ""}
                          {item.naam || "-"}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              ...subtleBadgeStyle,
                              background: colors.primarySoft,
                              color: colors.text,
                              border: `1px solid ${colors.primaryLight}`,
                            }}
                          >
                            {capitalize(item.serveerdag || "-")}
                          </span>

                          <span
                            style={{
                              ...subtleBadgeStyle,
                              background: colors.bgMuted,
                              color: colors.textMuted,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {formatCyclus(item)}
                          </span>

                          {item.cyclus_week ? (
                            <span
                              style={{
                                ...subtleBadgeStyle,
                                background: colors.bgMuted,
                                color: colors.textMuted,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              Startweek {item.cyclus_week}
                            </span>
                          ) : null}

                          {item.categorie ? (
                            <span
                              style={{
                                ...subtleBadgeStyle,
                                background: colors.bgMuted,
                                color: colors.textMuted,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              {item.categorie}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div
                        style={{
                          alignSelf: "center",
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "flex-end",
                        }}
                      >
                        {editingItemId === item.id ? (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={labelStyle}>Serveerdag</div>

                              <select
                                value={editServeerdag}
                                onChange={(e) => setEditServeerdag(e.target.value)}
                                style={{
                                  ...inputStyle,
                                  width: 150,
                                  padding: "10px 12px",
                                }}
                              >
                                <option value="">Kies dag</option>
                                {WEEKDAGEN.map((dag) => (
                                  <option key={dag} value={dag}>
                                    {capitalize(dag)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={labelStyle}>Serveerweek</div>

                              <input
                                value={editCyclusWeek}
                                onChange={(e) => setEditCyclusWeek(e.target.value)}
                                placeholder="Week"
                                type="number"
                                min={1}
                                style={{
                                  ...inputStyle,
                                  width: 110,
                                  padding: "10px 12px",
                                }}
                              />
                            </div>

                            <button
                              className="button"
                              type="button"
                              onClick={() => handleUpdateMenuItem(item)}
                              style={{
                                background: colors.primary,
                                color: colors.text,
                                border: "none",
                                borderRadius: 12,
                                padding: "10px 14px",
                                fontWeight: 700,
                              }}
                            >
                              Opslaan
                            </button>

                            <button
                              className="button"
                              type="button"
                              onClick={cancelEditMenuItem}
                              style={{
                                background: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 12,
                                padding: "10px 14px",
                                fontWeight: 600,
                              }}
                            >
                              Annuleren
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="button"
                              type="button"
                              onClick={() => startEditMenuItem(item)}
                              style={{
                                background: colors.primarySoft,
                                color: colors.text,
                                border: `1px solid ${colors.primaryLight}`,
                                borderRadius: 12,
                                padding: "10px 14px",
                                fontWeight: 700,
                              }}
                            >
                              Bewerken
                            </button>

                            <button
                              className="button"
                              type="button"
                              onClick={() => handleDeleteMenuItem(item.id)}
                              style={{
                                background: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 12,
                                padding: "10px 14px",
                                fontWeight: 600,
                              }}
                            >
                              Verwijderen
                            </button>
                          </>
                        )}
                      </div>