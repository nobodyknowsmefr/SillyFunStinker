/**
 * Fill Level Reader — Vercel Serverless Function
 *
 * Returns the current fill level (0–1) based on purchase count.
 * This is a PUBLIC endpoint — no secrets exposed.
 *
 * Environment variables (set in Vercel dashboard):
 *   UPSTASH_REDIS_REST_URL   — from Upstash dashboard
 *   UPSTASH_REDIS_REST_TOKEN — from Upstash dashboard
 *   FILL_GOAL                — number of purchases to fill the vat (default 100)
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const goal = parseInt(process.env.FILL_GOAL || '100', 10);

  if (!redisUrl || !redisToken) {
    console.error('Missing Upstash environment variables');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const response = await fetch(`${redisUrl}/get/shopify_purchase_count`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const data = await response.json();
    const count = parseInt(data.result || '0', 10);
    const fillLevel = Math.min(count / goal, 1);

    // Cache for 10 seconds to reduce Redis calls
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5');

    return res.status(200).json({ fillLevel, total: count, count, goal });
  } catch (err) {
    console.error('Fill level error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
