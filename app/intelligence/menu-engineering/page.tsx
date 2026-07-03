"use client";

import Link from "next/link";
import { useState } from "react";
import BubbleMatrix from "@/components/intelligence/BubbleMatrix";
import ReportTemplateSelector, {
  createDefaultReportConfig,
  type ReportConfigState,
} from "@/components/intelligence/report/ReportTemplateSelector";

type TabKey = "dashboard" | "matrix" | "top-bottom" | "insights" | "export";

type ProfileColumn = {
  name: string;
  dtype: string;
  empty_values: number;
  unique_values: number;
  is_numeric: boolean;
  is_date: boolean;
  is_text: boolean;
  detected_type: string | null;
};

type PreviewSummary = {
  rows: number;
  columns: number;
  column_names: string[];
  profile: ProfileColumn[];
};

type ValidationItem = {
  name: string;
  found: boolean;
};

type ValidationResult = {
  valid: boolean;
  required: ValidationItem[];
  optional: ValidationItem[];
};

type AnalysisKpis = {
  total_quantity: number;
  total_revenue: number;
  unique_items: number;
  unique_groups: number;
  average_quantity_per_item: number;
  average_revenue_per_item: number;
};

type RankedItem = {
  item_name: string;
  groups: string[];
  quantity: number;
  revenue: number;
};

type AnalysisResult = {
  parser: string;
  parser_version: string;
  parser_warnings: string[];
  skipped_rows: number;
  parsed_rows: number;
  item_count: number;
  kpis: AnalysisKpis;
  top_items: RankedItem[];
  bottom_items: RankedItem[];
  matrix: {
    average_quantity: number;
    average_revenue: number;
    quadrants: {
      star: number;
      workhorse: number;
      puzzle: number;
      dog: number;
    };
    bubbles: {
      item_name: string;
      groups: string[];
      quantity: number;
      revenue: number;
      x: number;
      y: number;
      radius: number;
      quadrant: "star" | "workhorse" | "puzzle" | "dog";
    }[];
  };
};


type PreviewResult = {
  status: string;
  filename: string;
  summary: PreviewSummary;
  validation: ValidationResult;
  analysis: AnalysisResult | null;
  decision_summary?: {
    total_decisions: number;
    actions: {
      KEEP: number;
      PROMOTE: number;
      REMOVE: number;
      WATCH: number;
      REVIEW: number;
    };
    priorities: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
  };
  top_actions?: {
    entity_name: string;
    action: string;
    priority: string;
    confidence: number;
    primary_reason: string;
    risk_flags?: string[];
    recommendation?: {
      title: string;
      management_message: string;
      expected_benefit: string;
      follow_up: string;
      urgency: string;
      recommendation_type: string;
    };
  }[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const tabs: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "matrix", label: "Matrix" },
  { key: "top-bottom", label: "Top & Bottom" },
  { key: "insights", label: "AI Insights" },
  { key: "export", label: "Export" },
];

const workflowSteps = [
  "Analysebestand",
  "Kassabestand",
  "Analyse uitvoeren",
  "Resultaten bekijken",
  "Rapport exporteren",
];

export default function MenuEngineeringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [cashRegisterFile, setCashRegisterFile] = useState<File | null>(null);

  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportConfig, setReportConfig] = useState<ReportConfigState>(
  createDefaultReportConfig("refter")
  );
  const [isExporting, setIsExporting] = useState(false);

  const canStartAnalysis = analysisFile !== null && !isLoading;

  async function handleStartAnalysis() {
    if (!analysisFile) return;

    setIsLoading(true);
    setErrorMessage("");
    setPreviewResult(null);

    try {
      const formData = new FormData();
      formData.append("analysis_file", analysisFile);

      const response = await fetch(
        `${API_BASE_URL}/intelligence/menu-engineering/preview`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "De analyse kon niet uitgevoerd worden.");
      }

      const data: PreviewResult = await response.json();
      setPreviewResult(data);
      setActiveTab("dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Er is een onbekende fout opgetreden."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportReport() {
    if (!analysisFile || !previewResult?.analysis) return;

    setIsExporting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("analysis_file", analysisFile);
      formData.append("report_config", JSON.stringify(reportConfig));

      const response = await fetch(
        `${API_BASE_URL}/intelligence/menu-engineering/export`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Het rapport kon niet geëxporteerd worden.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "kitchenmotors_intelligence_report.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Er is een onbekende fout opgetreden bij de export."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="app-page">
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard" style={{ fontWeight: 700 }}>
          ← Terug naar Dashboard
        </Link>
      </div>

      <section className="card" style={{ padding: 28, marginBottom: 24 }}>
        <p style={{ fontWeight: 700, color: "#9a6a00", margin: 0 }}>
          KitchenMotors Intelligence
        </p>

        <h1 style={{ marginTop: 10, marginBottom: 14 }}>Menu Engineering</h1>

        <p style={{ maxWidth: 760, color: "#555", margin: 0 }}>
          Analyseer gerechten op populariteit, opbrengst, prijszetting en
          verbeterkansen.
        </p>
      </section>

      <section className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 20 }}>Workflow</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {workflowSteps.map((step, index) => (
            <div
              key={step}
              className="card"
              style={{
                padding: 16,
                boxShadow: "none",
                borderColor:
                  index === 0 ||
                  (index === 1 && analysisFile) ||
                  (index === 2 && analysisFile) ||
                  (index === 3 && previewResult)
                    ? "#ffc000"
                    : "var(--border)",
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: "#777" }}>
                Stap {index + 1}
              </p>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 20 }}>Analyse starten</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div className="card" style={{ padding: 20, boxShadow: "none" }}>
            <h3>Analysebestand</h3>
            <p style={{ color: "#666" }}>
              Verplicht bestand met aantallen, omzet, categorieën en
              analysegegevens.
            </p>

            <label className="button" style={{ display: "inline-block" }}>
              Bestand kiezen
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(event) => {
                  setAnalysisFile(event.target.files?.[0] ?? null);
                  setPreviewResult(null);
                  setErrorMessage("");
                }}
              />
            </label>

            {analysisFile && (
              <p style={{ marginTop: 12, color: "#166534", fontWeight: 700 }}>
                Geselecteerd: {analysisFile.name}
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 20, boxShadow: "none" }}>
            <h3>Kassabestand optioneel</h3>
            <p style={{ color: "#666" }}>
              Wordt alleen gebruikt om verkoopprijzen toe te voegen wanneer
              beschikbaar.
            </p>

            <label className="button" style={{ display: "inline-block" }}>
              Bestand kiezen
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(event) => {
                  setCashRegisterFile(event.target.files?.[0] ?? null);
                }}
              />
            </label>

            {cashRegisterFile && (
              <p style={{ marginTop: 12, color: "#166534", fontWeight: 700 }}>
                Geselecteerd: {cashRegisterFile.name}
              </p>
            )}
          </div>
        </div>

        {errorMessage && (
          <p style={{ marginTop: 16, color: "#dc2626", fontWeight: 700 }}>
            {errorMessage}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button
            className="button"
            disabled={!canStartAnalysis}
            onClick={handleStartAnalysis}
            style={{
              background: canStartAnalysis ? "#ffc000" : "#ddd",
              color: "#111",
            }}
          >
            {isLoading ? "Analyse bezig..." : "Analyse starten"}
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 12,
            marginBottom: 22,
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="button"
                style={{
                  background: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#111",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <div>
            <h2>Dashboard</h2>

            {!previewResult && (
              <p style={{ color: "#666" }}>
                Kies een analysebestand en klik op Analyse starten.
              </p>
            )}

            {previewResult && (
              <>
                <p style={{ color: "#666", marginBottom: 22 }}>
                  Preview van het ingeladen analysebestand.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <article className="card" style={{ padding: 20 }}>
                    <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                      Bestand
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800 }}>
                      {previewResult.filename}
                    </p>
                  </article>

                  <article className="card" style={{ padding: 20 }}>
                    <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                      Aantal rijen
                    </p>
                    <p style={{ fontSize: 30, fontWeight: 800 }}>
                      {previewResult.summary.rows}
                    </p>
                  </article>

                  <article className="card" style={{ padding: 20 }}>
                    <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                      Aantal kolommen
                    </p>
                    <p style={{ fontSize: 30, fontWeight: 800 }}>
                      {previewResult.summary.columns}
                    </p>
                  </article>
                </div>

                {previewResult.analysis && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Totale omzet
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        € {previewResult.analysis.kpis.total_revenue.toLocaleString("nl-BE")}
                      </p>
                    </article>

                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Totale verkoop
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        {previewResult.analysis.kpis.total_quantity.toLocaleString("nl-BE")}
                      </p>
                    </article>

                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Unieke gerechten
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        {previewResult.analysis.kpis.unique_items}
                      </p>
                    </article>

                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Gerechtgroepen
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        {previewResult.analysis.kpis.unique_groups}
                      </p>
                    </article>

                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Gem. verkoop per gerecht
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        {previewResult.analysis.kpis.average_quantity_per_item.toLocaleString("nl-BE")}
                      </p>
                    </article>

                    <article className="card" style={{ padding: 20 }}>
                      <p style={{ color: "#666", fontWeight: 700, margin: 0 }}>
                        Gem. omzet per gerecht
                      </p>
                      <p style={{ fontSize: 30, fontWeight: 800 }}>
                        € {previewResult.analysis.kpis.average_revenue_per_item.toLocaleString("nl-BE")}
                      </p>
                    </article>
                  </div>
                )}

                <article className="card" style={{ padding: 22, boxShadow: "none" }}>
                  <h3>Kolommen gevonden</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {previewResult.summary.column_names.map((column) => (
                      <span
                        key={column}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                </article>
                <article
                    className="card"
                    style={{
                        padding: 22,
                        marginTop: 20,
                        boxShadow: "none",
                    }}
                    >
                    <h3 style={{ marginBottom: 18 }}>Dataset Inspector</h3>

                    <table
                        style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: 8 }}>Kolom</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Type</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Leeg</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Uniek</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Categorie</th>
                        </tr>
                        </thead>

                        <tbody>
                        {(previewResult.summary.profile ?? []).map((column) => (
                            <tr
                            key={column.name}
                            style={{
                                borderTop: "1px solid var(--border)",
                            }}
                            >
                            <td style={{ padding: 8, fontWeight: 700 }}>
                                {column.name}
                            </td>

                            <td style={{ padding: 8 }}>
                                {column.dtype}
                            </td>

                            <td
                                style={{
                                padding: 8,
                                textAlign: "center",
                                }}
                            >
                                {column.empty_values}
                            </td>

                            <td
                                style={{
                                padding: 8,
                                textAlign: "center",
                                }}
                            >
                                {column.unique_values}
                            </td>

                            <td
                                style={{
                                    padding: 8,
                                    textAlign: "center",
                                    fontWeight: 700,
                                }}
                                >
                                {column.detected_type === "date" && "📅 Datum"}
                                {column.detected_type === "dish" && "🍽️ Gerecht"}
                                {column.detected_type === "category" && "🏷️ Categorie"}
                                {column.detected_type === "sales" && "📈 Verkoop"}
                                {column.detected_type === "revenue" && "💰 Omzet"}
                                {column.detected_type === "price" && "💶 Prijs"}

                                {!column.detected_type && "—"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </article>
                    <article
                        className="card"
                        style={{
                            padding: 22,
                            marginTop: 20,
                            boxShadow: "none",
                        }}
                        >
                        <h3 style={{ marginBottom: 18 }}>
                            Menu Engineering Validatie
                        </h3>

                        <div
                            style={{
                            display: "grid",
                            gap: 10,
                            }}
                        >
                            {previewResult.validation.required.map((item) => (
                            <div
                                key={`required-${item.name}`}
                                style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid var(--border)",
                                paddingBottom: 8,
                                }}
                            >
                                <strong>{item.name}</strong>

                                <span
                                style={{
                                    color: item.found ? "#15803d" : "#dc2626",
                                    fontWeight: 700,
                                }}
                                >
                                {item.found ? "✅ Gevonden" : "❌ Ontbreekt"}
                                </span>
                            </div>
                            ))}

                            {previewResult.validation.optional.map((item) => (
                            <div
                                key={`optional-${item.name}`}
                                style={{
                                display: "flex",
                                justifyContent: "space-between",
                                opacity: 0.8,
                                }}
                            >
                                <span>{item.name} (optioneel)</span>

                                <span
                                style={{
                                    color: item.found ? "#15803d" : "#b45309",
                                    fontWeight: 700,
                                }}
                                >
                                {item.found ? "✅ Gevonden" : "⚠ Niet gevonden"}
                                </span>
                            </div>
                            ))}
                        </div>

                        <div
                            style={{
                            marginTop: 24,
                            padding: 16,
                            borderRadius: 12,
                            background: previewResult.validation.valid
                                ? "#dcfce7"
                                : "#fee2e2",
                            color: previewResult.validation.valid
                                ? "#166534"
                                : "#991b1b",
                            fontWeight: 800,
                            }}
                        >
                            {previewResult.validation.valid
                            ? "✅ Bestand is geschikt voor Menu Engineering."
                            : "❌ Bestand is nog niet geschikt voor Menu Engineering."}
                        </div>
                        </article>
              </>
            )}
          </div>
        )}

        {activeTab === "matrix" && (
          <div>
            {!previewResult?.analysis && (
              <p style={{ color: "#666" }}>
                Start eerst een analyse om de matrix te bekijken.
              </p>
            )}

            {previewResult?.analysis && (
              <BubbleMatrix matrix={previewResult.analysis.matrix} />
            )}
          </div>
        )}

        {activeTab === "top-bottom" && (
          <div>
            <h2>Top & Bottom</h2>

            {!previewResult?.analysis && (
              <p style={{ color: "#666" }}>
                Start eerst een analyse om top- en bottomgerechten te bekijken.
              </p>
            )}

            {previewResult?.analysis && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                  gap: 20,
                }}
              >
                <article className="card" style={{ padding: 22, boxShadow: "none" }}>
                  <h3>Top 10 op omzet</h3>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8 }}>#</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Gerecht</th>
                        <th style={{ textAlign: "right", padding: 8 }}>Verkoop</th>
                        <th style={{ textAlign: "right", padding: 8 }}>Omzet</th>
                      </tr>
                    </thead>

                    <tbody>
                      {previewResult.analysis.top_items.map((item, index) => (
                        <tr
                          key={`top-${item.item_name}`}
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          <td style={{ padding: 8 }}>{index + 1}</td>
                          <td style={{ padding: 8, fontWeight: 700 }}>
                            {item.item_name}
                            <div style={{ fontSize: 12, color: "#777" }}>
                              {item.groups.join(", ")}
                            </div>
                          </td>
                          <td style={{ padding: 8, textAlign: "right" }}>
                            {item.quantity.toLocaleString("nl-BE")}
                          </td>
                          <td style={{ padding: 8, textAlign: "right", fontWeight: 700 }}>
                            € {item.revenue.toLocaleString("nl-BE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>

                <article className="card" style={{ padding: 22, boxShadow: "none" }}>
                  <h3>Bottom 10 op omzet</h3>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8 }}>#</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Gerecht</th>
                        <th style={{ textAlign: "right", padding: 8 }}>Verkoop</th>
                        <th style={{ textAlign: "right", padding: 8 }}>Omzet</th>
                      </tr>
                    </thead>

                    <tbody>
                      {previewResult.analysis.bottom_items.map((item, index) => (
                        <tr
                          key={`bottom-${item.item_name}`}
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          <td style={{ padding: 8 }}>{index + 1}</td>
                          <td style={{ padding: 8, fontWeight: 700 }}>
                            {item.item_name}
                            <div style={{ fontSize: 12, color: "#777" }}>
                              {item.groups.join(", ")}
                            </div>
                          </td>
                          <td style={{ padding: 8, textAlign: "right" }}>
                            {item.quantity.toLocaleString("nl-BE")}
                          </td>
                          <td style={{ padding: 8, textAlign: "right", fontWeight: 700 }}>
                            € {item.revenue.toLocaleString("nl-BE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              </div>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div>
            <h2>AI Insights</h2>
            <p style={{ color: "#666" }}>
              Hier komen automatische inzichten en concrete acties voor
              management.
            </p>
          </div>
        )}

        {activeTab === "export" && (
          <div>
            <h2>Export</h2>

            {!previewResult?.analysis && (
              <p style={{ color: "#666" }}>
                Start eerst een analyse om een professioneel Excel-rapport te genereren.
              </p>
            )}

            {previewResult?.analysis && (
              <div style={{ display: "grid", gap: 20 }}>
                <ReportTemplateSelector
                  value={reportConfig}
                  onChange={setReportConfig}
                />

                <section className="card" style={{ padding: 22, boxShadow: "none" }}>
                  <h3 style={{ marginTop: 0 }}>Excel-rapport genereren</h3>

                  <p style={{ color: "#666", maxWidth: 760 }}>
                    Genereer een professioneel managementrapport in Excel op basis van
                    het gekozen rapporttype en de geselecteerde onderdelen.
                  </p>

                  <button
                    type="button"
                    className="button"
                    disabled={isExporting}
                    onClick={handleExportReport}
                    style={{
                      marginTop: 12,
                      background: isExporting ? "#ddd" : "#ffc000",
                      color: "#111",
                    }}
                  >
                    {isExporting ? "Rapport wordt gemaakt..." : "Excel genereren"}
                  </button>
                </section>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}