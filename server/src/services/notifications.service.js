import tls from 'node:tls';
import { env } from '../config/env.js';

function waitForLine(socket, state) {
  if (state.lines.length) return Promise.resolve(state.lines.shift());
  return new Promise((resolve, reject) => {
    state.waiters.push({ resolve, reject });
  });
}

function createReader(socket) {
  const state = { buffer: '', lines: [], waiters: [] };
  socket.on('data', chunk => {
    state.buffer += chunk.toString('utf8');
    let index;
    while ((index = state.buffer.indexOf('\r\n')) >= 0) {
      const line = state.buffer.slice(0, index);
      state.buffer = state.buffer.slice(index + 2);
      const waiter = state.waiters.shift();
      if (waiter) waiter.resolve(line);
      else state.lines.push(line);
    }
  });
  socket.on('error', error => {
    for (const waiter of state.waiters.splice(0)) waiter.reject(error);
  });
  socket.on('close', () => {
    for (const waiter of state.waiters.splice(0)) waiter.reject(new Error('Conexión SMTP cerrada.'));
  });
  return async () => {
    const lines = [];
    while (true) {
      const line = await waitForLine(socket, state);
      lines.push(line);
      if (/^\d{3} /.test(line)) break;
    }
    return { code: Number(lines.at(-1)?.slice(0, 3)), lines };
  };
}

async function sendGmail(to, subject, html) {
  const { user, appPassword, from } = env.email;
  if (!user || !appPassword || !from) {
    throw new Error('Correo no configurado. Define GMAIL_USER, GMAIL_APP_PASSWORD y EMAIL_FROM en Vercel.');
  }

  const socket = tls.connect({ host: 'smtp.gmail.com', port: 465, servername: 'smtp.gmail.com' });
  socket.setTimeout(15000, () => socket.destroy(new Error('Tiempo de espera agotado al conectar con Gmail.')));
  const readResponse = createReader(socket);
  const expect = async (codes, action) => {
    const response = await readResponse();
    if (!codes.includes(response.code)) {
      const safeLines = response.lines.map(line => line.replace(/(password|token|auth)\s*[:=]\s*\S+/ig, '$1=[oculto]'));
      throw new Error(`${action}: ${safeLines.join(' ').slice(0, 350)}`);
    }
    return response;
  };

  try {
    await new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });
    await expect([220], 'Gmail no aceptó la conexión');
    socket.write('EHLO servichoquib.vercel.app\r\n');
    await expect([250], 'No se pudo iniciar sesión SMTP');
    socket.write('AUTH LOGIN\r\n');
    await expect([334], 'Gmail rechazó la autenticación');
    socket.write(`${Buffer.from(user).toString('base64')}\r\n`);
    await expect([334], 'Gmail rechazó el usuario');
    socket.write(`${Buffer.from(appPassword.replace(/\s/g, '')).toString('base64')}\r\n`);
    await expect([235], 'Gmail rechazó la contraseña de aplicación');

    const fromAddress = (from.match(/<([^>]+)>/) || [])[1] || user;
    socket.write(`MAIL FROM:<${fromAddress}>\r\n`);
    await expect([250], 'Gmail rechazó el remitente');
    socket.write(`RCPT TO:<${to}>\r\n`);
    await expect([250, 251], 'Gmail rechazó el destinatario');
    socket.write('DATA\r\n');
    await expect([354], 'Gmail no aceptó el contenido del correo');

    const safeTo = String(to).replace(/[\r\n<>]/g, '');
    const safeFrom = String(from).replace(/[\r\n]/g, '');
    const safeSubject = String(subject).replace(/[\r\n]/g, '');
    const body = [
      `From: ${safeFrom}`,
      `To: ${safeTo}`,
      `Subject: ${safeSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..'),
      '.',
      '',
    ].join('\r\n');
    socket.write(body);
    await expect([250], 'Gmail no pudo entregar el correo');
    socket.write('QUIT\r\n');
    await expect([221], 'Gmail cerró la sesión SMTP');
  } finally {
    socket.end();
  }
}

export async function sendEmailCode(to, code, purpose = 'verificar tu correo') {
  const safePurpose = String(purpose).replace(/[<>&"]/g, '');
  const safeCode = String(code).replace(/\D/g, '');
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#172033"><h2 style="color:#0891b2">Servi Choquib</h2><p>Usa este código para ${safePurpose}:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4338ca">${safeCode}</p><p>Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</p></div>`;
  await sendGmail(to, 'Tu código de seguridad - Servi Choquib', html);
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
