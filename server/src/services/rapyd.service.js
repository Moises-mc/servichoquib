import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

const BASE_URLS = { sandbox: 'https://sandboxapi.rapyd.net', production: 'https://api.rapyd.net' };

export const isRapydConfigured = () => Boolean(env.rapyd.accessKey && env.rapyd.secretKey);

// Firma de Rapyd: base64( hex( HMAC-SHA256(secret, to_sign) ) )
function hmacSignature(toSign) {
  const hex = crypto.createHmac('sha256', env.rapyd.secretKey).update(toSign).digest('hex');
  return Buffer.from(hex).toString('base64');
}

async function rapydRequest(method, path, body) {
  if (!isRapydConfigured()) throw new HttpError(503, 'Los pagos con Rapyd no están configurados.');
  const salt = crypto.randomBytes(8).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const bodyString = body ? JSON.stringify(body) : '';
  const toSign = `${method.toLowerCase()}${path}${salt}${timestamp}${env.rapyd.accessKey}${env.rapyd.secretKey}${bodyString}`;
  let response;
  try {
    response = await fetch(`${BASE_URLS[env.rapyd.environment]}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_key: env.rapyd.accessKey,
        salt,
        timestamp,
        signature: hmacSignature(toSign),
      },
      ...(bodyString ? { body: bodyString } : {}),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error('Rapyd no respondió:', error.message);
    throw new HttpError(502, 'No se pudo contactar con Rapyd. Intenta de nuevo.');
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.status?.status !== 'SUCCESS') {
    console.error('Error Rapyd:', json?.status?.error_code, json?.status?.message);
    throw new HttpError(502, 'Rapyd rechazó la solicitud de pago.');
  }
  return json.data;
}

// Checkout alojado: Rapyd muestra su propia página de pago y devuelve redirect_url.
export async function createHostedCheckout({ booking, returnBase }) {
  const id = encodeURIComponent(booking.id);
  const success = `${returnBase}/pago-exitoso.html?booking=${id}`;
  const cancel = `${returnBase}/pago-cancelado.html?booking=${id}`;
  const data = await rapydRequest('POST', '/v1/checkout', {
    amount: Math.round(Number(booking.total)), // COP no usa decimales
    currency: env.rapyd.currency,
    country: env.rapyd.country,
    language: 'es',
    merchant_reference_id: booking.id,
    complete_payment_url: success,
    complete_checkout_url: success,
    error_payment_url: cancel,
    cancel_checkout_url: cancel,
    metadata: { booking_id: booking.id, service_id: booking.service_id || '' },
  });
  return { id: data.id, redirectUrl: data.redirect_url };
}

// Valida la firma del webhook: base64(hex(HMAC(url + salt + timestamp + access_key + secret_key + body))).
export function verifyWebhookSignature({ headers, rawBody, candidateUrls }) {
  if (!isRapydConfigured()) return false;
  const { salt, timestamp, signature } = headers;
  if (!salt || !timestamp || !signature || !rawBody) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const received = Buffer.from(String(signature));
  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  return candidateUrls.filter(Boolean).some(url => {
    const expected = Buffer.from(hmacSignature(`${url}${salt}${timestamp}${env.rapyd.accessKey}${env.rapyd.secretKey}${bodyString}`));
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  });
}
