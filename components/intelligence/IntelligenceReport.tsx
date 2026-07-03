import ManagementSummary from "@/components/intelligence/ManagementSummary";

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
  risk_flags?: string[];
  recommendation?: {
    title: string;
    management_message: string;
    expected_benefit: string;
    follow_up: string;
    urgency: string;
    recommendation_type: string;
  };
};

type PreviewResult = {
  decision_summary?: DecisionSummary;
  top_actions?: TopAction[];
};

type IntelligenceReportProps = {
  previewResult: PreviewResult;
};

export default function IntelligenceReport({
  previewResult,
}: IntelligenceReportProps) {
  return (
    <div style={{ display: "grid", gap: 24, marginBottom: 24 }}>
      <ManagementSummary
        decisionSummary={previewResult.decision_summary}
        topActions={previewResult.top_actions}
      />
    </div>
  );
}