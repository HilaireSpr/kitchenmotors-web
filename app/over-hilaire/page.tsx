import Link from "next/link";
import { colors } from "@/styles/colors";

export default function OverHilairePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
      }}
    >
      <section
        style={{
          padding: "72px clamp(24px, 6vw, 96px)",
          borderBottom: `1px solid ${colors.border}`,
          background:
            "linear-gradient(135deg, #fffdf7 0%, #fff8de 48%, #fff3bf 100%)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              color: colors.textMuted,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Terug naar KitchenMotors
          </Link>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 760,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: colors.textMuted,
              }}
            >
              Over de maker
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1,
                letterSpacing: "-0.05em",
                color: colors.text,
              }}
            >
              Gebouwd vanuit de realiteit van professionele keukens.
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 20,
                lineHeight: 1.7,
                color: colors.textMuted,
                maxWidth: 720,
              }}
            >
              KitchenMotors is geen software die vanop afstand naar keukens
              kijkt. Het systeem is ontstaan uit jaren praktijkervaring op de
              werkvloer.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "64px clamp(24px, 6vw, 96px)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 280px",
            gap: 40,
            alignItems: "start",
          }}
        >
          <article
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              fontSize: 18,
              lineHeight: 1.8,
              color: colors.text,
            }}
          >
            <p>
              Mijn naam is <strong>Hilaire Spreuwers</strong>.
            </p>

            <p>
              Al meer dan twintig jaar werk ik in en rond professionele
              keukens. Als chef, horecaondernemer, consultant en bestuurder heb
              ik honderden keukens van dichtbij gezien. Van restaurants en
              cateringbedrijven tot zorginstellingen en grootkeukens.
            </p>

            <p>
              Doorheen die jaren zag ik telkens hetzelfde probleem terugkomen.
            </p>

            <p>
              Keukens beschikken vandaag over moderne apparatuur, uitgebreide
              ERP-systemen en digitale registraties. Maar de dagelijkse
              productieplanning gebeurt vaak nog met Excel-bestanden, papieren
              schema&apos;s en kennis die in het hoofd van enkele ervaren
              medewerkers zit.
            </p>

            <p>
              Dat werkt, tot iemand afwezig is. Of tot de organisatie groeit. Of
              tot de complexiteit te groot wordt.
            </p>

            <div
              style={{
                padding: 24,
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                background: colors.bgMuted,
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  fontSize: 28,
                  letterSpacing: "-0.03em",
                }}
              >
                De vragen die telkens terugkwamen
              </h2>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <li>Wanneer moeten we wat produceren?</li>
                <li>Welke post heeft nog capaciteit?</li>
                <li>Hoe vermijden we pieken en tekorten?</li>
                <li>
                  Hoe houden we rekening met recepturen, productiecycli en
                  werkverdeling?
                </li>
                <li>Waarom kost plannen zoveel tijd?</li>
              </ul>
            </div>

            <p>
              Ik vond nergens software die écht vanuit de keuken dacht. Niet
              vanuit boekhouding. Niet vanuit voorraadbeheer. Maar vanuit
              productie.
            </p>

            <p>
              Daarom ben ik begonnen met <strong>KitchenMotors</strong>.
            </p>

            <p>
              KitchenMotors is ontstaan vanuit praktijkervaring op de werkvloer.
              Het systeem wordt ontwikkeld vanuit de dagelijkse realiteit van
              grootkeukens, ziekenhuizen, woonzorgcentra en productiekeukens.
            </p>

            <p>
              Mijn doel is eenvoudig: keukenteams helpen om minder tijd te
              verliezen aan plannen, zoeken en improviseren, zodat ze meer tijd
              hebben voor wat echt belangrijk is: kwalitatieve maaltijden
              produceren.
            </p>

            <p>
              KitchenMotors wordt vandaag nog steeds ontwikkeld in nauwe
              samenwerking met professionele keukens. Elke nieuwe functie
              ontstaat vanuit een concreet probleem op de werkvloer.
            </p>

            <p>
              Geen theoretische software. Maar een planningssysteem gebouwd door
              iemand die jarenlang zelf in de keuken heeft gestaan.
            </p>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/contact"
                className="button"
                style={{
                  background: colors.primary,
                  color: colors.text,
                  textDecoration: "none",
                }}
              >
                Plan een demo
              </Link>

              <Link
                href="/oplossing"
                className="button"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  textDecoration: "none",
                }}
              >
                Bekijk de oplossing
              </Link>
            </div>
          </article>

          <aside
            style={{
              position: "sticky",
              top: 24,
              padding: 24,
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              background: colors.bgMuted,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: colors.textMuted,
                  marginBottom: 8,
                }}
              >
                Hilaire Spreuwers
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                }}
              >
                Chef, ondernemer en bouwer van KitchenMotors.
              </h2>
            </div>

            <p
              style={{
                margin: 0,
                color: colors.textMuted,
                lineHeight: 1.7,
              }}
            >
              KitchenMotors combineert keukenpraktijk met softwareontwikkeling.
              Niet als abstract platform, maar als hulpmiddel voor echte
              productiekeukens.
            </p>

            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                paddingTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
                color: colors.textMuted,
              }}
            >
              <div>Professionele keukens</div>
              <div>Productieplanning</div>
              <div>Receptbeheer</div>
              <div>Capaciteitsplanning</div>
              <div>Werkvloeruitvoering</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}