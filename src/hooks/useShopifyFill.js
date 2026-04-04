import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useShopifyFill — tracks real-time purchase progress.
 *
 * MODES:
 *   demo   — slowly fills over time for visual testing (default)
 *   live   — polls a backend API that aggregates Shopify webhook data
 *
 * ARCHITECTURE (live mode):
 *
 *   Shopify Webhook (orders/create)
 *       ↓  POST /api/shopify-webhook
 *   Serverless Function (Netlify / Vercel)
 *       → validates HMAC signature
 *       → extracts order total
 *       → upserts running total in KV store (e.g. Upstash Redis, Supabase)
 *       ↓
 *   GET /api/purchase-progress  →  { total: 17345, goal: 50000 }
 *       ↓
 *   Client polls every `pollInterval` ms
 *       → fillLevel = total / goal  (clamped 0..1)
 *
 * USAGE:
 *   const { fillLevel, total, goal } = useShopifyFill({
 *     mode: 'demo',           // or 'live'
 *     goal: 50000,
 *     apiUrl: '/api/purchase-progress',
 *     pollInterval: 10000,
 *   });
 */

export function useShopifyFill({
  mode = 'demo',
  goal = 50000,
  apiUrl = '/api/fill-level',
  pollInterval = 10000,
  demoSpeed = 0.03,        // fill-per-second in demo mode
  demoStartFill = 0.35,    // starting fill in demo mode
} = {}) {
  const [total, setTotal] = useState(mode === 'demo' ? goal * demoStartFill : 0);
  const [error, setError] = useState(null);
  const animRef = useRef(null);

  // ---- Demo mode: gentle animated fill ----
  useEffect(() => {
    if (mode !== 'demo') return;
    let running = true;
    let t = 0;
    const base = demoStartFill;

    function tick() {
      if (!running) return;
      t += 0.016;
      // Smooth oscillation that trends upward slowly
      const wave = Math.sin(t * demoSpeed * 2 * Math.PI) * 0.05;
      const drift = Math.min(t * demoSpeed * 0.1, 0.3);
      const fill = Math.min(base + wave + drift, 0.98);
      setTotal(Math.round(fill * goal));
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode, goal, demoSpeed, demoStartFill]);

  // ---- Live mode: poll backend API ----
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTotal(data.total ?? 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (mode !== 'live') return;
    fetchProgress();
    const id = setInterval(fetchProgress, pollInterval);
    return () => clearInterval(id);
  }, [mode, pollInterval, fetchProgress]);

  const fillLevel = Math.min(Math.max(total / goal, 0), 1);

  return { fillLevel, total, goal, error };
}
