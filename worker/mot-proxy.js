/**
 * Cloudflare Worker: Serverless Proxy for DVSA MOT History API
 * 
 * Routes:
 *   GET /?registration=AB12CDE
 * 
 * Environment Variables (set securely in Cloudflare Dashboard or wrangler secret):
 *   - DVSA_API_KEY: Your official DVSA MOT History API Key
 *   - DVSA_CLIENT_ID (optional): If using OAuth client credentials
 *   - DVSA_CLIENT_SECRET (optional): If using OAuth client credentials
 * 
 * CORS:
 *   Strictly allows: https://cozyjournal.github.io
 */

const ALLOWED_ORIGIN = "https://cozyjournal.github.io";
const DVSA_API_BASE = "https://history.mot.api.gov.uk/v1/trade/vehicles/registration";

// In-memory rate limiting map (per-Worker instance)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
    rateLimits.set(ip, record);
    return false;
  }

  record.count += 1;
  rateLimits.set(ip, record);
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const clientIP = request.headers.get("CF-Connecting-IP") || "anonymous";
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Retry-After": "60",
        },
      });
    }

    const url = new URL(request.url);
    const rawPlate = url.searchParams.get("registration");

    if (!rawPlate) {
      return new Response(JSON.stringify({ error: "Missing registration parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      });
    }

    // Validate registration: 2 to 8 uppercase alphanumeric characters, spaces stripped
    const plate = rawPlate.replace(/\s+/g, "").toUpperCase();
    const plateRegex = /^[A-Z0-9]{2,8}$/;

    if (!plateRegex.test(plate)) {
      return new Response(JSON.stringify({ error: "Invalid registration plate format" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      });
    }

    // Check if API key is configured
    if (!env.DVSA_API_KEY) {
      return new Response(JSON.stringify({ error: "DVSA API proxy key not configured on server" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      });
    }

    // Check Cache API
    const cache = caches.default;
    const cacheKey = new Request(`https://dvsa-cache.internal/plate/${plate}`, { method: "GET" });
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      // Return cached with CORS header
      const headers = new Headers(cachedResponse.headers);
      headers.set("Access-Control-Allow-Origin": ALLOWED_ORIGIN);
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers,
      });
    }

    // Call DVSA MOT History API
    try {
      const dvsaUrl = `${DVSA_API_BASE}/${encodeURIComponent(plate)}`;
      const dvsaResponse = await fetch(dvsaUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "x-api-key": env.DVSA_API_KEY,
          // Support for OAuth Bearer token if configured in env
          ...(env.DVSA_OAUTH_TOKEN ? { "Authorization": `Bearer ${env.DVSA_OAUTH_TOKEN}` } : {}),
        },
      });

      if (dvsaResponse.status === 404) {
        return new Response(JSON.stringify({ error: "Vehicle not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          },
        });
      }

      if (!dvsaResponse.ok) {
        return new Response(JSON.stringify({ error: "Upstream error from DVSA service" }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          },
        });
      }

      const data = await dvsaResponse.text();

      // Create response and cache for 5 minutes (300 seconds)
      const clientResponse = new Response(data, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Cache-Control": "public, max-age=300",
        },
      });

      ctx.waitUntil(cache.put(cacheKey, clientResponse.clone()));
      return clientResponse;

    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to connect to DVSA MOT service" }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      });
    }
  },
};
