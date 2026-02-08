/**
 * Audio transcription for WhatsApp Option A (voice messages).
 * Uses OpenRouter's input_audio API (chat/completions) so one key (OPENROUTER_API_KEY) covers both chat and transcription.
 * See: https://openrouter.ai/docs/guides/overview/multimodal/audio
 *
 * Audio must be base64-encoded; direct URLs are not supported for audio on OpenRouter.
 */

import logger from "../../../config/logger";
import { env } from "../../../config/env";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/** OpenRouter audio formats (lowercase). See OpenRouter audio docs. */
const MIME_TO_FORMAT: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/opus": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/webm": "webm",
  "audio/flac": "flac",
  "audio/aiff": "aiff",
  "audio/aac": "aac",
};

function getFormatFromMime(mimeType: string, fileName?: string): string {
  const mime = mimeType?.toLowerCase().split(";")[0].trim();
  if (mime && MIME_TO_FORMAT[mime]) return MIME_TO_FORMAT[mime];
  // Fallback from filename
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext && ["ogg", "mp3", "m4a", "wav", "webm", "flac", "aiff", "aac"].includes(ext))
    return ext;
  return "ogg"; // WhatsApp voice often sends ogg
}

/**
 * Transcribe audio buffer to text using OpenRouter (input_audio).
 * Uses OPENROUTER_API_KEY and a model that supports audio (e.g. google/gemini-2.5-flash).
 * Returns empty string if no API key or on failure (caller can fallback to generic message).
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    logger.debug("Transcribe: OPENROUTER_API_KEY not set, skipping");
    return "";
  }
  if (buffer.length > MAX_FILE_SIZE) {
    logger.warn("Transcribe: file too large", { size: buffer.length });
    return "";
  }
  const format = getFormatFromMime(mimeType, fileName);
  const base64Audio = buffer.toString("base64");

  const model = env.WHATSAPP_CONVERSATION_MODEL;
  if (!model?.trim()) {
    logger.debug("Transcribe: WHATSAPP_CONVERSATION_MODEL not set, skipping");
    return "";
  }

  try {
    const body = {
      model,
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: "Transcribe this audio to plain text. Output only the transcription, no commentary or punctuation beyond what is spoken.",
            },
            {
              type: "input_audio" as const,
              input_audio: {
                data: base64Audio,
                format,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:8080",
        "X-Title": "Grievance Aid System",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn("Transcribe: OpenRouter API error", {
        status: response.status,
        body: errText.slice(0, 300),
      });
      return "";
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || "";
  } catch (err) {
    logger.warn("Transcribe: OpenRouter audio failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}
