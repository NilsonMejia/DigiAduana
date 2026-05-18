const nodemailer = require('nodemailer');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildSmtpTransport() {
  if (!process.env.SMTP_HOST) return null;

  const smtpPassword = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: smtpPassword
        }
      : undefined
  });
}

async function sendVerificationEmail({ to, name, verificationUrl, verificationCode }) {
  const from = process.env.EMAIL_FROM || 'DigiAduana <no-reply@digiaduana.local>';
  const subject = 'Valida tu cuenta DigiAduana';
  const safeName = escapeHtml(name || '');
  const safeUrl = escapeHtml(verificationUrl);
  const html = `
    <p>Hola ${safeName},</p>
    <p>Tu cuenta DigiAduana fue creada. Tienes dos opciones para activar tu acceso:</p>
    <p><strong>Opcion 1: Haz clic en el siguiente boton</strong></p>
    <p style="margin: 25px 0;">
      <a href="${safeUrl}" style="padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif; display: inline-block;">
        Verificar mi cuenta
      </a>
    </p>
    <p><strong>Opci on 2: Ingresa este codigo manualmente</strong></p>
    <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:18px 0; color: #1e3a8a;">${escapeHtml(verificationCode || '')}</p>
    <p>Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
    <p><a href="${safeUrl}" style="color: #3b82f6; word-break: break-all;">${safeUrl}</a></p>
    <p>Este acceso vence en 24 horas.</p>
  `;
  const text = `Hola ${name || ''},\n\nTu codigo de verificacion DigiAduana es: ${verificationCode || ''}\n\nIngresa el codigo en esta pagina:\n${verificationUrl}\n\nEste codigo vence en 24 horas.`;

  const smtpTransport = buildSmtpTransport();
  if (smtpTransport) {
    const info = await smtpTransport.sendMail({ from, to, subject, html, text });
    console.info(`Correo de verificacion enviado por SMTP a ${to}: ${info.messageId}`);
    return { sent: true, provider: 'smtp', messageId: info.messageId };
  }

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html, text })
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      throw new Error(`No se pudo enviar correo de validacion: ${error || response.status}`);
    }

    return { sent: true, provider: 'resend' };
  }

  console.warn(`Validacion de correo pendiente para ${to}: ${verificationUrl}`);
  return { sent: false, provider: 'console' };
}

module.exports = {
  sendVerificationEmail
};
