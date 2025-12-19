const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'no-reply@tu-dominio.com';

if (!RESEND_API_KEY) {
  console.warn('⚠️ Falta RESEND_API_KEY en variables de entorno. Correos no podrán enviarse.');
}

async function loadTemplate(filename) {
  try {
    const filePath = path.join(__dirname, 'emailTemplates', filename);
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error(`❌ No se pudo leer la plantilla ${filename}:`, err);
    return '';
  }
}

function replacePlaceholders(template = '', map = {}) {
  return Object.entries(map).reduce((acc, [key, value]) => {
    const safe = value ?? '';
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), safe);
  }, template);
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY no definido, skipping sendEmail');
    return;
  }
  if (!to) {
    console.warn('⚠️ Email destino vacío, skipping sendEmail');
    return;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('❌ Error enviando correo Resend:', text);
    }
  } catch (err) {
    console.error('❌ Error sendEmail:', err);
  }
}

function renderItems(detalle = []) {
  if (!Array.isArray(detalle) || detalle.length === 0) return '<li>Sin ítems.</li>';
  return detalle
    .map(
      (d) =>
        `<li>${d?.producto_nombre ?? 'Producto'} x ${d?.cantidad ?? 0} — ${d?.precio_unitario ?? ''}</li>`
    )
    .join('');
}

async function sendPaymentSuccessEmail(data) {
  const { email, nombre, id_pedido, monto, currency, detalle, ferreteria } = data;
  const subject = `Tu compra fue recibida - Pedido ${id_pedido}`;
  const template = await loadTemplate('paymentSuccess.html');
  const html = replacePlaceholders(template, {
    order_id: id_pedido,
    ferreteria: ferreteria ?? '',
    total: `${monto ?? ''} ${currency ?? ''}`.trim(),
    items: renderItems(detalle),
  }).replace('{{nombre}}', nombre ?? '');

  await sendEmail({ to: email, subject, html });
}

async function sendPaymentFailedEmail(data) {
  const { email, nombre, id_pedido, error_message } = data;
  const subject = `Tu pago no pudo completarse - Pedido ${id_pedido}`;
  const template = await loadTemplate('paymentFailed.html');
  const html = replacePlaceholders(template, {
    order_id: id_pedido,
    error_message: error_message ?? 'No se pudo procesar el pago. Intenta nuevamente.',
  }).replace('{{nombre}}', nombre ?? '');

  await sendEmail({ to: email, subject, html });
}

module.exports = {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
};

