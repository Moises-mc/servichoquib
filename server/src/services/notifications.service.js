import tls from 'node:tls';
import { env } from '../config/env.js';

function parseMailbox(value) {
  const match = String(value || '').match(/<([^<>]+)>/);
  return (match ? match[1] : String(value || '')).trim();
}

function smtpConnection() {
  const socket = tls.connect({
    host: 'smtp.gmail.com',
    port: 465,
    servername: 'smtp.gmail.com',
  });
  socket.setTimeout(15000, () => socket.destroy(new Error('Tiempo de espera agotado al conectar con Gmail SMTP.')));
  let buffer = '';
  const lines = [];
  const waiters = [];
  socket.on('data', chunk => {
    buffer += chunk.toString('utf8');
    let index;
    while ((index = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (waiters.length) waiters.shift()(line);
      else lines.push(line);
    }
  });
  socket.on('error', error => {
    while (waiters.length) waiters.shift()(null, error);
  });
  socket.on('close', () => {
    while (waiters.length) waiters.shift()(null, new Error('La conexión SMTP se cerró inesperadamente.'));
  });

  const readLine = () => {
    if (lines.length) return Promise.resolve(lines.shift());
    return new Promise((resolve, reject) => {
      waiters.push((line, error) => error ? reject(error) : resolve(line));
    });
  };
  const readResponse = async () => {
    const responseLines = [];
    let line;
    do {
      line = await readLine();
      if (line === null) throw new Error('Gmail cerró la conexión SMTP.');
      responseLines.push(line);
    } while (/^\d{3}-/.test(line));
    const code = Number(responseLines.at(-1)?.slice(0, 3));
    return { code, text: responseLines.join('\n') };
  };
  const command = async (value, expected) => {
    socket.write(`${value}\r\n`);
    const response = await readResponse();
    if (!expected.includes(response.code)) {
      throw new Error(`Gmail SMTP rechazó una operación (${response.code}). Verifica el correo y la contraseña de aplicación.`);
    }
    return response;
  };
  return { socket, readResponse, command };
}

async function sendViaGmail(to, code, purpose) {
  const user = env.email.gmailUser;
  const appPassword = env.email.gmailAppPassword.replace(/\s+/g, '');
  const from = env.email.from || `Servi Choquib <${user}>`;
  const fromAddress = parseMailbox(from);
  if (!user || !appPassword || !fromAddress) {
    throw new Error('Correo no configurado. En Vercel define GMAIL_USER, GMAIL_APP_PASSWORD y EMAIL_FROM.');
  }

  const { socket, readResponse, command } = smtpConnection();
  try {
    await new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });
    const greeting = await readResponse();
    if (greeting.code !== 220) throw new Error('No se pudo iniciar la conexión segura con Gmail SMTP.');
    await command('EHLO servichoquib.vercel.app', [250]);
    await command('AUTH LOGIN', [334]);
    await command(Buffer.from(user).toString('base64'), [334]);
    await command(Buffer.from(appPassword).toString('base64'), [235]);
    await command(`MAIL FROM:<${fromAddress}>`, [250]);
    await command(`RCPT TO:<${to}>`, [250, 251]);
    await command('DATA', [354]);

    const subject = 'Tu código de seguridad - Servi Choquib';
    const html = `<div style="font-family:Arial,sans-serif;color:#172554"><h2>Servi Choquib</h2><p>Usa este código para ${purpose}:</p><p style="font-size:30px;font-weight:bold;letter-spacing:8px">${code}</p><p>Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</p></div>`;
    const plain = `Tu código de Servi Choquib para ${purpose} es ${code}. Vence en 10 minutos.`;
    const boundary = `servichoquib_${Date.now()}`;
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      plain,
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
      `--${boundary}--`,
      '',
    ].join('\r\n').replace(/^\./gm, '..');
    socket.write(`${message}\r\n.\r\n`);
    const accepted = await readResponse();
    if (accepted.code !== 250) throw new Error('Gmail no aceptó el mensaje. Revisa la configuración de la cuenta.');
    await command('QUIT', [221]);
  } catch (error) {
    socket.destroy();
    if (/Gmail SMTP|Gmail no aceptó|Tiempo de espera|conexión segura/.test(error.message)) throw error;
    throw new Error('No fue posible enviar el correo mediante Gmail. Revisa GMAIL_USER y la contraseña de aplicación.');
  } finally {
    if (!socket.destroyed) socket.end();
  }
}

export async function sendEmailCode(to, code, purpose = 'verificar tu correo') {
  // Resend se mantiene como alternativa si ya estaba configurado.
  if (env.email.resendApiKey && env.email.resendFrom) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.email.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.email.resendFrom,
        to: [to],
        subject: 'Tu código de seguridad - Servi Choquib',
        html: `<div style="font-family:Arial,sans-serif"><h2>Servi Choquib</h2><p>Usa este código para ${purpose}:</p><p style="font-size:30px;font-weight:bold;letter-spacing:8px">${code}</p><p>Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</p></div>`,
      }),
    });
    if (!response.ok) throw new Error('Resend no pudo enviar el correo. Revisa RESEND_API_KEY y RESEND_FROM_EMAIL.');
    return;
  }
  await sendViaGmail(to, code, purpose);
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
