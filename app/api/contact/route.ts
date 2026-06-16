import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
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

    await resend.emails.send({
      from: "KitchenMotors Website <onboarding@resend.dev>",
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

    await resend.emails.send({
      from: "KitchenMotors Website <onboarding@resend.dev>",
      to: email,
      subject: "We hebben je demo-aanvraag ontvangen",
      text: `
    Beste ${name},

    Bedankt voor je mail.

    We hebben je aanvraag voor een demo van KitchenMotors goed ontvangen.

    KitchenMotors helpt grootkeukens om recepten, menu's, capaciteit en werkvloeruitvoering samen te brengen in één productieplanning.

    We nemen normaal binnen 1 werkdag contact met je op om je situatie beter te begrijpen en te bekijken hoe KitchenMotors kan helpen.

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
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}