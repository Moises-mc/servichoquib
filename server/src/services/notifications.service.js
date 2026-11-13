import { env } from '../config/env.js';

export async function sendEmailCode(to, code, purpose = 'verificar tu correo') {
  if (!env.email.resendApiKey || !env.email.from) throw new Error('Correo no configurado. Define RESEND_API_KEY y RESEND_FROM_EMAIL.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.email.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.email.from, to: [to], subject: 'Tu código de seguridad - Servi Choquib',
      html: `<div style="font-family:Arial,sans-serif"><h2>Servi Choquib</h2><p>Usa este código para ${purpose}:</p><p style="font-size:30px;font-weight:bold;letter-spacing:8px">${code}</p><p>Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</p></div>` }),
  });
  if (!response.ok) throw new Error('No fue posible enviar el correo. Revisa la configuración de Resend.');
}

export async function sendSmsCode(to, code) {
  const digits = String(to || '').replace(/[^0-9+]/g, '');
  const destination = /^\+\d{10,15}$/.test(digits) ? digits : /^3\d{9}$/.test(digits) ? `+57${digits}` : '';
  if (!destination) throw new Error('El teléfono debe tener formato internacional, por ejemplo +573001234567.');
  if (!env.sms.accountSid || !env.sms.authToken || !env.sms.from) throw new Error('SMS no configurado. Define las variables de Twilio.');
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.sms.accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: destination, From: env.sms.from, Body: `Tu código de Servi Choquib es ${code}. Vence en 10 minutos.` });
  const auth = Buffer.from(`${env.sms.accountSid}:${env.sms.authToken}`).toString('base64');
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error('No fue posible enviar el SMS. Revisa la configuración de Twilio.');
}
