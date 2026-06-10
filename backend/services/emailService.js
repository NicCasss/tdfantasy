const nodemailer = require("nodemailer");

function buildResetPasswordEmail({ resetLink }) {
  const subject = "Reimposta la password - TDF Fantasy";

  const text = `
Hai richiesto il reset della password per il tuo account TDF Fantasy.

Apri questo link per scegliere una nuova password:
${resetLink}

Se non sei stato tu a richiederlo, puoi ignorare questa email.
`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#FFF7F0; font-family: Arial, Helvetica, sans-serif; color:#2B211B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7F0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#FFFFFF; border-radius:28px; overflow:hidden; box-shadow:0 24px 60px rgba(43,33,27,0.16);">
          
          <tr>
            <td style="background:#F26A00; padding:34px 28px; color:#FFFFFF;">
              <div style="font-size:13px; font-weight:800; letter-spacing:2px; text-transform:uppercase; opacity:0.85;">
                TDF Fantasy
              </div>

              <h1 style="margin:12px 0 0; font-size:32px; line-height:1.1; font-weight:900;">
                Reimposta la password
              </h1>

              <p style="margin:14px 0 0; font-size:15px; line-height:1.6; opacity:0.9;">
                Hai richiesto il recupero dell’accesso alla tua area personale.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0; font-size:16px; line-height:1.7; color:#2B211B;">
                Ciao,
              </p>

              <p style="margin:12px 0 0; font-size:16px; line-height:1.7; color:#6A5B52;">
                clicca sul pulsante qui sotto per scegliere una nuova password e rientrare nel tuo account TDF Fantasy.
              </p>

              <div style="text-align:center; margin:32px 0;">
                <a href="${resetLink}" 
                   style="display:inline-block; background:#F26A00; color:#FFFFFF; text-decoration:none; font-size:16px; font-weight:900; padding:16px 26px; border-radius:18px;">
                  Reimposta password
                </a>
              </div>

              <div style="background:#FFF7F0; border:1px solid #E9E2DB; border-radius:18px; padding:18px;">
                <p style="margin:0; font-size:14px; line-height:1.6; color:#6A5B52;">
                  Se il pulsante non funziona, copia e incolla questo link nel browser:
                </p>

                <p style="margin:10px 0 0; font-size:13px; line-height:1.5; word-break:break-all;">
                  <a href="${resetLink}" style="color:#F26A00; font-weight:700;">
                    ${resetLink}
                  </a>
                </p>
              </div>

              <p style="margin:24px 0 0; font-size:14px; line-height:1.6; color:#6A5B52;">
                Se non hai richiesto tu il reset della password, puoi ignorare questa email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px; background:#FFF7F0; border-top:1px solid #E9E2DB;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6A5B52;">
                Questa email è stata inviata automaticamente da TDF Fantasy.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject, text, html };
}

async function sendResetPasswordEmail(email, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(resetToken)}`;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure =
    String(process.env.SMTP_SECURE || "true").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `TDF Fantasy <${user}>`;

  if (!host || !port || !user || !pass) {
    console.log("SMTP non configurato. Link reset:", resetLink);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const { subject, text, html } = buildResetPasswordEmail({ resetLink });

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });

  return true;
}

module.exports = { sendResetPasswordEmail };