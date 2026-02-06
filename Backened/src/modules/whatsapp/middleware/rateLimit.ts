/**
 * Rate limiters for WhatsApp webhook to protect the server from:
 * - Floods and DDoS (per-IP burst and sustained limits)
 * - Bots and excessive repeated requests
 *
 * GET /webhook (Meta verification) is not limited so subscription works.
 * POST /webhook is limited by IP: burst (10s) + sustained (1 min).
 */

import rateLimit from "express-rate-limit";

/** Burst: max requests per 10 seconds per IP. Stops rapid-fire bots. */
const WEBHOOK_BURST_WINDOW_MS = 10 * 1000;
const WEBHOOK_BURST_MAX = 25;

/** Sustained: max requests per minute per IP. Allows normal Meta delivery. */
const WEBHOOK_SUSTAINED_WINDOW_MS = 60 * 1000;
const WEBHOOK_SUSTAINED_MAX = 100;

const webhookLimitMessage =
  "Too many requests from this IP. Please try again later.";

/**
 * Burst limiter: 25 requests per 10 seconds per IP.
 * Applied to POST /webhook only (skip GET for verification).
 */
export const webhookBurstLimiter = rateLimit({
  windowMs: WEBHOOK_BURST_WINDOW_MS,
  max: WEBHOOK_BURST_MAX,
  message: webhookLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
});

/**
 * Sustained limiter: 100 requests per minute per IP.
 * Applied to POST /webhook only.
 */
export const webhookSustainedLimiter = rateLimit({
  windowMs: WEBHOOK_SUSTAINED_WINDOW_MS,
  max: WEBHOOK_SUSTAINED_MAX,
  message: webhookLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET",
});

/**
 * Optional stricter limiter for test endpoints to prevent abuse.
 * 30 requests per minute per IP for /test/chat and /test/flow.
 */
export const testEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many test requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
