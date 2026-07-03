type DecisionSummary = {
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

type TopAction = {
  entity_name: string;
  action: string;
  priority: string;
  confidence: number;
  primary_reason: string;
  recommendation?: {
    title: string;
    management_message: string;
    expected_benefit: string;
    follow_up: string;
    urgency: string;
    recommendation_type: string;
  };
};

type ManagementSummaryProps = {
  decisionSummary?: DecisionSummary;
  topActions?: TopAction[];
};

export default function ManagementSummary({
  decisionSummary,
  topActions = [],
}: ManagementSummaryProps) {
  if (!decisionSummary) {
    return null;
  }

  const actions = decisionSummary.actions;
  const actionRequired =
    actions.PROMOTE + actions.REMOVE + actions.WATCH + actions.REVIEW;

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Management Summary</h2>
          <p style={styles.subtitle}>
            Overzicht van de belangrijkste managementacties uit de analyse.
          </p>
        </div>

        <div style={styles.totalBox}>
          <strong>{decisionSummary.total_decisions}</strong>
          <span>gerechten geanalyseerd</span>
        </div>
      </div>

      <div style={styles.cards}>
        <SummaryCard label="Actie vereist" value={actionRequired} />
        <SummaryCard label="Promoten" value={actions.PROMOTE} />
        <SummaryCard label="Opvolgen" value={actions.WATCH} />
        <SummaryCard label="Verwijderen" value={actions.REMOVE} />
        <SummaryCard label="Review" value={actions.REVIEW} />
        <SummaryCard label="Behouden" value={actions.KEEP} />
      </div>

      {topActions.length > 0 && (
        <div style={styles.actionsBlock}>
          <h3 style={styles.blockTitle}>Aanbevolen managementacties</h3>

          <div style={styles.actionList}>
            {topActions.slice(0, 5).map((action, index) => (
              <article key={`${action.entity_name}-${index}`} style={styles.actionCard}>
                <div style={styles.actionTop}>
                  <strong>{action.entity_name}</strong>
                  <span style={styles.badge}>
                    {action.action} · {action.priority} · {action.confidence}%
                  </span>
                </div>

                {action.recommendation ? (
                  <>
                    <p style={styles.recommendationTitle}>
                      {action.recommendation.title}
                    </p>
                    <p style={styles.text}>
                      {action.recommendation.management_message}
                    </p>
                    <p style={styles.followUp}>
                      Follow-up: {action.recommendation.follow_up}
                    </p>
                  </>
                ) : (
                  <p style={styles.text}>{action.primary_reason}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.card}>
      <strong style={styles.cardValue}>{value}</strong>
      <span style={styles.cardLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 24,
    background: "#ffffff",
    marginBottom: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  totalBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    color: "#374151",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#f9fafb",
  },
  cardValue: {
    display: "block",
    fontSize: 26,
    lineHeight: 1,
  },
  cardLabel: {
    display: "block",
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  actionsBlock: {
    marginTop: 24,
  },
  blockTitle: {
    margin: "0 0 12px",
    fontSize: 18,
  },
  actionList: {
    display: "grid",
    gap: 12,
  },
  actionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#ffffff",
  },
  actionTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "4px 10px",
    whiteSpace: "nowrap",
  },
  recommendationTitle: {
    margin: "8px 0 4px",
    fontWeight: 700,
  },
  text: {
    margin: "4px 0",
    color: "#4b5563",
  },
  followUp: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },
};