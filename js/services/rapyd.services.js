const axios = require('axios');
const crypto = require('crypto');

const RAPYD_ACCESS_KEY = process.env.RAPYD_ACCESS_KEY;
const RAPYD_SECRET_KEY = process.env.RAPYD_SECRET_KEY;
const RAPYD_BASE_URL = process.env.RAPYD_ENV === 'production'
    ? 'https://api.rapyd.net'
    : 'https://sandboxapi.rapyd.net';

// Función para firmar peticiones a Rapyd
const generarFirma = (method, path, cuerpo) => {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const cuerpoStr = cuerpo ? JSON.stringify(cuerpo) : '';
    const firmaBase = `${method.toUpperCase()}${path}${timestamp}${RAPYD_ACCESS_KEY}${cuerpoStr}`;
    return crypto.createHmac('sha256', RAPYD_SECRET_KEY).update(firmaBase).digest('base64');
};

// Crear sesión de pago
const createCheckout = async (orden) => {
    try {
        const path = '/v1/checkout';
        const cuerpo = {
            amount: orden.amount,
            currency: orden.currency || 'COP',
            description: orden.descripcion || 'Pago por servicio en ServiChoquib',
            merchant_reference_id: orden.referencia || `ORDEN-${Date.now()}`,
            complete_payment_url: orden.urlRetorno,
            cancel_payment_url: orden.urlCancelacion,
        };

        const respuesta = await axios.post(`${RAPYD_BASE_URL}${path}`, cuerpo, {
            headers: {
                'access_key': RAPYD_ACCESS_KEY,
                'signature': generarFirma('POST', path, cuerpo),
                'timestamp': Math.floor(new Date().getTime() / 1000),
                'Content-Type': 'application/json',
            },
        });

        return {
            ok: true,
            id: respuesta.data.data.id,
            urlPago: respuesta.data.data.redirect_url,
            estado: respuesta.data.data.status,
        };
    } catch (error) {
        console.error('❌ Error Rapyd:', error.response?.data || error.message);
        return {
            ok: false,
            error: error.response?.data?.status?.message || error.message
        };
    }
};

// Consultar estado de un pago
const consultarPago = async (checkoutId) => {
    try {
        const path = `/v1/checkout/${checkoutId}`;
        const respuesta = await axios.get(`${RAPYD_BASE_URL}${path}`, {
            headers: {
                'access_key': RAPYD_ACCESS_KEY,
                'signature': generarFirma('GET', path, null),
                'timestamp': Math.floor(new Date().getTime() / 1000),
            },
        });
        return { ok: true, datos: respuesta.data.data };
    } catch (error) {
        return { ok: false, error: error.response?.data?.status?.message || error.message };
    }
};

module.exports = { createCheckout, consultarPago };
