type ReportHeaderProps = {
  title: string;
  subtitle?: string;
  filename?: string;
};

export default function ReportHeader({
  title,
  subtitle,
  filename,
}: ReportHeaderProps) {
  return (
    <section className="card" style={{ padding: 28, marginBottom: 24 }}>
      <p style={{ fontWeight: 700, color: "#9a6a00", margin: 0 }}>
        KitchenMotors Intelligence Report
      </p>

      <h1 style={{ marginTop: 10, marginBottom: 10 }}>{title}</h1>

      {subtitle && (
        <p style={{ color: "#555", margin: 0, maxWidth: 760 }}>{subtitle}</p>
      )}

      {filename && (
        <p style={{ marginTop: 14, color: "#777", fontWeight: 700 }}>
          Analysebestand: {filename}
        </p>
      )}
    </section>
  );
}