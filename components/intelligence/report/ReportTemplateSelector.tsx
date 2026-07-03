"use client";

export type ReportTemplateKey = "refter" | "menu" | "custom";

export type ReportSectionKey =
  | "summary"
  | "top_best"
  | "top_worst"
  | "year_analysis"
  | "curve"
  | "matrix"
  | "recommendations"
  | "patterns"
  | "lift_analysis"
  | "normalized_data"
  | "menu_kpi"
  | "foodbank_ranking"
  | "component_analysis"
  | "signals"
  | "menu_detail";

export type ReportSectionsState = Record<ReportSectionKey, boolean>;

export type ReportConfigState = {
  template: ReportTemplateKey;
  sections: ReportSectionsState;
};

type ReportTemplate = {
  key: ReportTemplateKey;
  label: string;
  description: string;
  defaultSections: ReportSectionKey[];
};

type ReportSection = {
  key: ReportSectionKey;
  label: string;
  description: string;
};

type Props = {
  value: ReportConfigState;
  onChange: (value: ReportConfigState) => void;
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    key: "refter",
    label: "Refteranalyse",
    description: "Verkoop, populariteit, opbrengst en managementacties.",
    defaultSections: [
      "summary",
      "top_best",
      "top_worst",
      "year_analysis",
      "curve",
      "matrix",
      "recommendations",
    ],
  },
  {
    key: "menu",
    label: "Menuanalyse",
    description: "Patiëntenmenu, foodbank, componenten en verbeterkansen.",
    defaultSections: [
      "summary",
      "menu_kpi",
      "foodbank_ranking",
      "component_analysis",
      "signals",
      "menu_detail",
      "recommendations",
    ],
  },
  {
    key: "custom",
    label: "Vrij rapport",
    description: "Zelf kiezen welke rapportonderdelen worden opgenomen.",
    defaultSections: ["summary"],
  },
];

const REPORT_SECTIONS: ReportSection[] = [
  {
    key: "summary",
    label: "Samenvatting",
    description: "Managementsamenvatting met kerncijfers en belangrijkste signalen.",
  },
  {
    key: "top_best",
    label: "Top 20 best verkocht",
    description: "Rangschikking van de best verkopende gerechten.",
  },
  {
    key: "top_worst",
    label: "Top 20 minst verkocht",
    description: "Rangschikking van de minst verkopende gerechten.",
  },
  {
    key: "year_analysis",
    label: "Jaaranalyse",
    description: "Vergelijking en evolutie per jaar.",
  },
  {
    key: "curve",
    label: "Curve 2025-2026",
    description: "Evolutie van verkoop doorheen de tijd.",
  },
  {
    key: "matrix",
    label: "Engineering Matrix",
    description: "Bubble matrix met populariteit en opbrengst.",
  },
  {
    key: "recommendations",
    label: "Aanbevelingen",
    description: "Managementacties en beslissingsadvies.",
  },
  {
    key: "patterns",
    label: "Patronen",
    description: "Terugkerende patronen in verkoop en aanbod.",
  },
  {
    key: "lift_analysis",
    label: "Lift analyse",
    description: "Analyse van combinaties en versterkende effecten.",
  },
  {
    key: "normalized_data",
    label: "Genormaliseerde data",
    description: "Onderliggende opgeschoonde data voor controle.",
  },
  {
    key: "menu_kpi",
    label: "Menu KPI",
    description: "Kerncijfers van het patiëntenmenu.",
  },
  {
    key: "foodbank_ranking",
    label: "Foodbank ranking",
    description: "Rangschikking van componenten die gekozen worden als alternatief.",
  },
  {
    key: "component_analysis",
    label: "Componentanalyse",
    description: "Analyse per menucomponent.",
  },
  {
    key: "signals",
    label: "Signalen",
    description: "Belangrijke afwijkingen, risico’s en aandachtspunten.",
  },
  {
    key: "menu_detail",
    label: "Menu detail",
    description: "Detailanalyse van menu’s en componentkeuzes.",
  },
];

export function createDefaultReportConfig(
  templateKey: ReportTemplateKey = "refter"
): ReportConfigState {
  const template =
    REPORT_TEMPLATES.find((item) => item.key === templateKey) ??
    REPORT_TEMPLATES[0];

  const sections = REPORT_SECTIONS.reduce((acc, section) => {
    acc[section.key] = template.defaultSections.includes(section.key);
    return acc;
  }, {} as ReportSectionsState);

  return {
    template: template.key,
    sections,
  };
}

export default function ReportTemplateSelector({ value, onChange }: Props) {
  function handleTemplateChange(templateKey: ReportTemplateKey) {
    onChange(createDefaultReportConfig(templateKey));
  }

  function handleSectionToggle(sectionKey: ReportSectionKey) {
    onChange({
      ...value,
      template: value.template,
      sections: {
        ...value.sections,
        [sectionKey]: !value.sections[sectionKey],
      },
    });
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Rapport samenstellen</h2>
          <p style={styles.subtitle}>
            Kies een rapporttemplate en bepaal zelf welke onderdelen in het
            Excel-rapport komen.
          </p>
        </div>
      </div>

      <div style={styles.templateGrid}>
        {REPORT_TEMPLATES.map((template) => {
          const active = value.template === template.key;

          return (
            <button
              key={template.key}
              type="button"
              onClick={() => handleTemplateChange(template.key)}
              style={{
                ...styles.templateCard,
                ...(active ? styles.templateCardActive : {}),
              }}
            >
              <span style={styles.radioRow}>
                <span
                  style={{
                    ...styles.radio,
                    ...(active ? styles.radioActive : {}),
                  }}
                />
                <span style={styles.templateLabel}>{template.label}</span>
              </span>
              <span style={styles.templateDescription}>
                {template.description}
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.sectionBlock}>
        <h3 style={styles.sectionTitle}>Rapportonderdelen</h3>

        <div style={styles.checkboxGrid}>
          {REPORT_SECTIONS.map((section) => {
            const checked = Boolean(value.sections[section.key]);

            return (
              <label key={section.key} style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleSectionToggle(section.key)}
                  style={styles.checkbox}
                />

                <span>
                  <span style={styles.checkboxLabel}>{section.label}</span>
                  <span style={styles.checkboxDescription}>
                    {section.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#6b7280",
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  templateCard: {
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#ffffff",
    padding: 16,
    cursor: "pointer",
  },
  templateCardActive: {
    borderColor: "#f59e0b",
    background: "#fffbeb",
  },
  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid #d1d5db",
    display: "inline-block",
  },
  radioActive: {
    borderColor: "#f59e0b",
    background: "#f59e0b",
    boxShadow: "inset 0 0 0 3px #ffffff",
  },
  templateLabel: {
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
  },
  templateDescription: {
    display: "block",
    fontSize: 13,
    lineHeight: 1.45,
    color: "#6b7280",
  },
  sectionBlock: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: 20,
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 10,
  },
  checkboxCard: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff",
    cursor: "pointer",
  },
  checkbox: {
    marginTop: 3,
    width: 16,
    height: 16,
    accentColor: "#f59e0b",
  },
  checkboxLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  checkboxDescription: {
    display: "block",
    marginTop: 3,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#6b7280",
  },
};