// Supabase Edge Function: notify-booking
// Triggered by Database Webhook on INSERT to 'bookings' table
// Sends email notification to property owner via Gmail SMTP
import nodemailer from "npm:nodemailer@6.9.16";

const GMAIL_USER = Deno.env.get("GMAIL_USER")!;       // es: luca.dibelardino@gmail.com
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;  // App Password da Google
const OWNER_EMAIL = "luca.dibelardino@gmail.com";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const booking = payload.record;

    if (!booking) {
      return new Response(JSON.stringify({ error: "No record in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const checkIn = new Date(booking.check_in).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const checkOut = new Date(booking.check_out).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const guestName = `${booking.name || ""} ${booking.last_name || ""}`.trim();

    const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fdfbf7; border-radius: 16px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #001f3f 0%, #003366 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">🏠 Nuova Prenotazione</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Hidden Treasure — Villasimius</p>
      </div>
      
      <div style="padding: 32px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Nome</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${guestName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">
              <a href="mailto:${booking.email}" style="color: #001f3f;">${booking.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Telefono</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">
              <a href="tel:${booking.phone}" style="color: #001f3f;">${booking.phone || "Non fornito"}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Check-in</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Check-out</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Ospiti</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; text-align: right;">${booking.guests || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Totale</td>
            <td style="padding: 12px 0; font-weight: 800; font-size: 20px; text-align: right; color: #001f3f;">€${booking.total_price || "N/A"}</td>
          </tr>
        </table>

        ${booking.message ? `
        <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 12px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Messaggio</p>
          <p style="margin: 0; color: #333;">${booking.message}</p>
        </div>
        ` : ""}
      </div>

      <div style="padding: 16px 32px 24px; text-align: center; color: #888; font-size: 12px;">
        Ricevuto il ${new Date().toLocaleDateString("it-IT")} alle ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>`;

    await transporter.sendMail({
      from: `"Hidden Treasure" <${GMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: `🏠 Nuova Prenotazione — ${guestName} (${checkIn})`,
      html: htmlBody,
    });

    console.log("Email sent successfully to", OWNER_EMAIL);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
