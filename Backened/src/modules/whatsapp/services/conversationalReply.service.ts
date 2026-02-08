/**
 * Conversational reply for COLLECT_FREE_FORM: session context + LLM with short timeout.
 * Fallback to templates.freeFormAdded on timeout or error to keep response speed.
 */

import logger from "../../../config/logger";
import { callLLM } from "../../../services/ai.service";
import { whatsappConfig } from "../config";
import type { WhatsAppSession } from "../types";
import { templates } from "../conversation/templates";

const CONVERSATION_TIMEOUT_MS = 4500;
const BUFFER_PREVIEW_LEN = 800;

function buildSessionContext(
  session: WhatsAppSession,
  currentMessage: string
): string {
  const parts: string[] = [
    "Context: User is filing a grievance (Option A - describe in one go).",
    `Current step: collecting free-form description.`,
  ];
  const buf = (session.freeFormTextBuffer ?? "").trim();
  if (buf) {
    const preview =
      buf.length <= BUFFER_PREVIEW_LEN
        ? buf
        : buf.slice(0, BUFFER_PREVIEW_LEN) + "...";
    parts.push(`So far they wrote:\n${preview}`);
  }
  const imgCount = session.data?.images?.length ?? 0;
  const docCount = session.data?.documents?.length ?? 0;
  if (imgCount + docCount > 0) {
    parts.push(`Attachments: ${imgCount} image(s), ${docCount} document(s).`);
  }
  parts.push(`\nLatest message from user:\n${currentMessage}`);
  return parts.join("\n");
}

const SYSTEM_PROMPT = `You are a friendly complaint intake assistant for Uttar Pradesh government grievances. The user is describing their issue in their own words. Reply in 1-2 short sentences: acknowledge what they said and encourage them to add more details or reply "done" when finished. Be warm and concise. Do not extract or repeat structured data; just acknowledge. Reply in the same language as the user if possible, otherwise English.`;

/**
 * Get a short conversational reply using session context and current message.
 * Uses a short timeout; on timeout or LLM error returns templates.freeFormAdded.
 */
export async function getConversationalReply(
  session: WhatsAppSession,
  currentMessage: string
): Promise<string> {
  const model = whatsappConfig.conversationModel;
  if (!model) {
    logger.warn("WHATSAPP_CONVERSATION_MODEL not set, using fallback message");
    return templates.freeFormAdded;
  }
  const userPrompt = buildSessionContext(session, currentMessage);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Conversational reply timeout")),
      CONVERSATION_TIMEOUT_MS
    )
  );

  try {
    const reply = await Promise.race([
      callLLM(userPrompt, SYSTEM_PROMPT, {
        model,
        maxTokens: 150,
        temperature: 0.4,
        responseFormat: "text",
      }),
      timeoutPromise,
    ]);
    const trimmed = (reply || "").trim();
    return trimmed.length > 0 ? trimmed : templates.freeFormAdded;
  } catch (err) {
    logger.warn("Conversational reply failed, using fallback", {
      error: err instanceof Error ? err.message : String(err),
    });
    return templates.freeFormAdded;
  }
}
