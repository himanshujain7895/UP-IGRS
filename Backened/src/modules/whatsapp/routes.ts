import { Router } from "express";
import {
  handleWebhook,
  // testChat,
  // testFlow,
  verifyWebhook,
} from "./controllers/whatsapp.controller";
import {
  webhookBurstLimiter,
  webhookSustainedLimiter,
  testEndpointsLimiter,
} from "./middleware/rateLimit";

const router = Router();

// GET not rate-limited so Meta verification succeeds
router.get("/webhook", verifyWebhook);
// POST: burst (25/10s) then sustained (100/min) per IP to protect from floods and bots
router.post(
  "/webhook",
  webhookBurstLimiter,
  webhookSustainedLimiter,
  handleWebhook
);

// Test APIs commented out for now (re-enable when needed)
// router.post("/test/chat", testEndpointsLimiter, testChat);
// router.post("/test/flow", testEndpointsLimiter, testFlow);

export default router;
