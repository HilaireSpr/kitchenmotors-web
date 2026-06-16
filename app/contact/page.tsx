"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { colors } from "@/styles/colors";

export default function ContactPage() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      phone: String(formData.get("phone") || ""),
      organizationType: String(formData.get("organizationType") || ""),
      message: String(formData.get("message") || ""),
      consent: formData.get("consent") === "on",
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    form.reset();
    setStatus("success");
  }

  return (
    <MarketingLayout>
      <section
        style={{
          padding: "72px clamp(24px, 5vw, 72px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: 48,
          alignItems: "start",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(42px, 6vw, 72px)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            Demo aanvragen
          </h1>

          <p
            style={{
              marginTop: 22,
              color: colors.textMuted,
              fontSize: 20,
              lineHeight: 1.6,
            }}
          >
            Wil je KitchenMotors testen in je grootkeuken? Stuur ons een bericht
            en we bekijken samen of een demo of piloottraject past.
          </p>

          <div
            style={{
              marginTop: 36,
              padding: 24,
              borderRadius: 24,
              background: "rgba(255,255,255,0.86)",
              border: `1px solid ${colors.border}`,
              display: "grid",
              gap: 18,
            }}
          >
            <ContactInfo title="E-mail" text="hilaire@kitchenmotors.be" />
            <ContactInfo title="Telefoon" text="+32 488 99 00 17" />
            <ContactInfo title="Locatie" text="België" />
          </div>

          <p style={{ marginTop: 24, color: colors.textMuted }}>
            We reageren binnen 1 werkdag.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 24,
            borderRadius: 24,
            background: "rgba(255,255,255,0.9)",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 20px 60px rgba(17,17,17,0.08)",
            display: "grid",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: 16,
            }}
          >
            <Field name="name" label="Naam *" placeholder="Je volledige naam" />
            <Field
              name="email"
              label="E-mailadres *"
              placeholder="je@bedrijf.be"
              type="email"
            />
            <Field
              name="company"
              label="Bedrijf *"
              placeholder="Naam van je organisatie"
            />
            <Field
              name="phone"
              label="Telefoonnummer"
              placeholder="+32 4 12 34 56 78"
              required={false}
            />
          </div>

          <label style={{ display: "grid", gap: 8, fontWeight: 800 }}>
            Type organisatie *
            <select
              name="organizationType"
              required
              defaultValue=""
              style={inputStyle}
            >
              <option value="" disabled>
                Kies een type organisatie
              </option>
              <option value="zorgkeuken">Zorgkeuken</option>
              <option value="ziekenhuis">Ziekenhuis</option>
              <option value="woonzorgcentrum">Woonzorgcentrum</option>
              <option value="catering">Catering</option>
              <option value="school-overheid">School of overheid</option>
              <option value="andere">Andere</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 8, fontWeight: 800 }}>
            Bericht *
            <textarea
              name="message"
              required
              placeholder="Vertel ons kort over je grootkeuken, huidige uitdagingen en wat je wil bereiken..."
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              color: colors.textMuted,
              lineHeight: 1.45,
              fontSize: 14,
            }}
          >
            <input name="consent" type="checkbox" required style={{ marginTop: 3 }} />
            <span>
              Ik ga akkoord dat KitchenMotors mijn gegevens verwerkt om contact
              op te nemen.
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              marginTop: 4,
              border: "none",
              borderRadius: 12,
              padding: "14px 18px",
              background: colors.primary,
              color: "#ffffff",
              fontWeight: 900,
              fontSize: 16,
              cursor: status === "sending" ? "not-allowed" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "Versturen..." : "Verstuur aanvraag"}
          </button>

          {status === "success" && (
            <div style={{ color: colors.success, fontWeight: 800 }}>
              Bedankt! Je aanvraag werd verstuurd.
            </div>
          )}

          {status === "error" && (
            <div style={{ color: colors.danger, fontWeight: 800 }}>
              Er ging iets mis. Probeer opnieuw of mail naar
              hilaire@kitchenmotors.be.
            </div>
          )}
        </form>
      </section>
    </MarketingLayout>
  );
}

function ContactInfo({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 4, color: colors.textMuted }}>{text}</div>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 8, fontWeight: 800 }}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: "13px 14px",
  fontSize: 15,
  background: "#ffffff",
  color: colors.text,
};