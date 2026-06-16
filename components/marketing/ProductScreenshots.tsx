import Image from "next/image";
import { colors } from "@/styles/colors";

const screenshots = [
  {
    title: "Productieplanning",
    text: "Van menu naar uitvoerbare planning met posten, starturen en capaciteit.",
    image: "/screenshots/planner-gantt.png",
  },
  {
    title: "Receptbeheer",
    text: "Beheer recepten, handelingen, toestellen, tijden en productieposten.",
    image: "/screenshots/receptbeheer.png",
  },
  {
    title: "Werkvloer",
    text: "Duidelijke smartphone takenlijst voor medewerkers op de keukenvloer.",
    image: "/screenshots/workfloor.png",
    mobile: true,
  },
];

export function ProductScreenshots() {
  return (
    <section style={{ padding: "32px clamp(24px, 5vw, 72px) 72px" }}>
      <div style={{ maxWidth: 760, marginBottom: 36 }}>
        <div
          style={{
            color: colors.textMuted,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 12,
          }}
        >
          In de praktijk
        </div>

        <h2
          style={{
            margin: "12px 0 0",
            fontSize: "clamp(34px, 5vw, 58px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          Gebouwd voor de realiteit van grootkeukens.
        </h2>
      </div>

      <div style={{ display: "grid", gap: 36 }}>
        {screenshots.map((item, index) => (
          <article
            key={item.title}
            style={{
              display: "grid",
              gridTemplateColumns: item.mobile
                ? "280px minmax(0, 1fr)"
                : "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
              gap: 32,
              alignItems: "center",
              padding: 24,
              borderRadius: 28,
              background: "rgba(255,255,255,0.86)",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 20px 60px rgba(17,17,17,0.07)",
            }}
          >
            <div style={{ order: item.mobile ? 1 : index % 2 === 0 ? 0 : 1 }}>
              <Image
                src={item.image}
                alt={item.title}
                width={item.mobile ? 520 : 1600}
                height={item.mobile ? 1100 : 900}
                style={{
                  width: "100%",
                  maxWidth: 280,
                  height: "auto",
                  borderRadius: item.mobile ? 28 : 18,
                  border: `1px solid ${colors.border}`,
                }}
              />
            </div>

            <div style={{ order: item.mobile ? 0 : index % 2 === 0 ? 1 : 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  marginTop: 16,
                  color: colors.textMuted,
                  fontSize: 19,
                  lineHeight: 1.55,
                }}
              >
                {item.text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}