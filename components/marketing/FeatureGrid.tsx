import { colors } from "@/styles/colors";

type Feature = {
  title: string;
  text: string;
};

export function FeatureGrid({
  eyebrow,
  title,
  intro,
  features,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  features: Feature[];
}) {
  return (
    <section style={{ padding: "72px clamp(24px, 5vw, 72px)" }}>
      <div style={{ maxWidth: 760 }}>
        <div
          style={{
            color: colors.textMuted,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 12,
          }}
        >
          {eyebrow}
        </div>

        <h1
          style={{
            margin: "12px 0 0",
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            marginTop: 20,
            color: colors.textMuted,
            fontSize: 19,
            lineHeight: 1.6,
          }}
        >
          {intro}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginTop: 36,
        }}
      >
        {features.map((feature) => (
          <article
            key={feature.title}
            style={{
              padding: 22,
              borderRadius: 22,
              border: `1px solid ${colors.border}`,
              background: "rgba(255,255,255,0.86)",
              boxShadow: "0 16px 40px rgba(17,17,17,0.06)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22 }}>{feature.title}</h2>
            <p style={{ color: colors.textMuted, lineHeight: 1.55 }}>
              {feature.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}