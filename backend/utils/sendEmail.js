import nodemailer from "nodemailer";

/**
 * Sends an email through SMTP. If SMTP is not configured (local development),
 * the email is printed to the console so password-reset can still be demoed.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text, html });
};
