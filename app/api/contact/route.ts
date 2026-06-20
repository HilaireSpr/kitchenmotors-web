import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("Missing RESEND_API_KEY");
      return NextResponse.json(
        { ok: false, error: "missing_resend_api_key" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await req.json();

    const {
      name,
      email,
      company,
      phone,
      organizationType,
      message,
      consent,
    } = body;

    if (
      !name ||
      !email ||
      !company ||
      !organizationType ||
      !message ||
      !consent
    ) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    const fromEmail = "KitchenMotors Website <noreply@send.kitchenmotors.be>";

    const internalMail = await resend.emails.send({
      from: fromEmail,
      to: process.env.CONTACT_TO_EMAIL || "hilaire@kitchenmotors.be",
      replyTo: email,
      subject: `Nieuwe demo aanvraag van ${company}`,
      text: `
Nieuwe demo aanvraag via KitchenMotors

Naam: ${name}
E-mail: ${email}
Bedrijf: ${company}
Telefoon: ${phone || "-"}
Type organisatie: ${organizationType}

Bericht:
${message}
      `.trim(),
    });

    if (internalMail.error) {
      console.error("Internal mail error:", internalMail.error);
      return NextResponse.json(
        { ok: false, error: "internal_mail_failed" },
        { status: 500 }
      );
    }

    const confirmationMail = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "We hebben je demo-aanvraag ontvangen",
      text: `
Beste ${name},

Bedankt voor je mail.

We hebben je aanvraag voor een demo van KitchenMotors goed ontvangen.

KitchenMotors helpt grootkeukens om recepten, menu's, capaciteit en werkvloeruitvoering samen te brengen in één productieplanning.

We nemen normaal binnen 1 werkdag contact met je op.

Samenvatting van je aanvraag:

- Bedrijf: ${company}
- Type organisatie: ${organizationType}

Met vriendelijke groeten,

Hilaire Spreuwers
KitchenMotors
hilaire@kitchenmotors.be
+32 488 99 00 17
      `.trim(),
    });

    if (confirmationMail.error) {
      console.error("Confirmation mail error:", confirmationMail.error);
      return NextResponse.json(
        { ok: false, error: "confirmation_mail_failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}