async function sendVerificationEmail({ to, name, verificationUrl }) {
  const from = process.env.EMAIL_FROM || 'DigiAduana <no-reply@digiaduana.local>';
  const subject = 'Valida tu cuenta DigiAduana';
  const html = `
    <p>Hola ${name || ''},</p>
    <p>Tu cuenta DigiAduana fue creada. Valida tu correo para activar el acceso:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Este enlace vence en 24 horas.</p>
  `;

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
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
