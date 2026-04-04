import crypto from 'crypto';

/**
 * Shopify Webhook Receiver — Vercel Serverless Function
 *
 * Receives `orders/create` webhooks from Shopify, verifies the HMAC
 * signature, and increments the purchase counter in Upstash Redis.
 *
 * Environment variables (set in Vercel dashboard):
 *   SHOPIFY_WEBHOOK_SECRET  — from Shopify webhook settings
 *   UPSTASH_REDIS_REST_URL  — from Upstash dashboard
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash dashboard
 *   FILL_GOAL               — number of purchases to fill the vat (default 100)
 */

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function verifyHmac(rawBody, hmacHeader, secret) {
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader || '')
  );
}

async function incrementRedis(url, token) {
  const res = await fetch(`${url}/incr/shopify_purchase_count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.result; // new count
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!secret || !redisUrl || !redisToken) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const rawBody = await readRawBody(req);
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];

    if (!verifyHmac(rawBody, hmacHeader, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const count = await incrementRedis(redisUrl, redisToken);
    console.log(`Purchase recorded. Total: ${count}`);

    return res.status(200).json({ ok: true, count });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
