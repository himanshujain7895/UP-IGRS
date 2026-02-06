/**
 * Audio transcription for WhatsApp Option A (voice messages).
 * Uses OpenAI Whisper when OPENAI_API_KEY is set; otherwise returns empty and caller can fallback.
 */

import axios from "axios";
import logger from "../../../config/logger";
import { env } from "../../../config/env";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Transcribe audio buffer to text using OpenAI Whisper.
 * Returns empty string if no API key, or on failure (caller should fallback to generic message).
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    logger.debug("Transcribe: OPENAI_API_KEY not set, skipping");
    return "";
  }
  if (buffer.length > MAX_FILE_SIZE) {
    logger.warn("Transcribe: file too large", { size: buffer.length });
    return "";
  }
  try {
    const { default: FormData } = await import("form-data");
    const form = new FormData();
    const name = fileName || `audio.${mimeType.split("/")[1] || "ogg"}`;
    form.append("file", buffer, {
      filename: name,
      contentType: mimeType,
    });
    form.append("model", "whisper-1");
    const response = await axios.post<{ text?: string }>(WHISPER_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });
    const text = response.data?.text?.trim();
    return text || "";
  } catch (err) {
    logger.warn("Transcribe: Whisper API failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}
