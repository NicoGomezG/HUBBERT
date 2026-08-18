import { createPublicKey, verify } from "node:crypto";
import { Routes } from "discord-api-types/v10";
import type { RESTPatchAPIWebhookWithTokenMessageJSONBody } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

// Discord manda la public key como 32 bytes raw (hex). Node necesita la key
// envuelta en DER/SPKI para poder usarla con crypto.verify — este prefijo es
// el header fijo de un SubjectPublicKeyInfo para Ed25519 (RFC 8410).
const ED25519_SPKI_PREFIX = "302a300506032b6570032100";

export function verifyDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  publicKeyHex: string
): boolean {
  if (!signature || !timestamp) return false;

  try {
    const publicKey = createPublicKey({
      key: Buffer.from(ED25519_SPKI_PREFIX + publicKeyHex, "hex"),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + rawBody), publicKey, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

/** Edita la respuesta original de una interacción — usado tras un deferred response (type 5/6). */
export async function editOriginalInteractionResponse(
  applicationId: string,
  interactionToken: string,
  body: RESTPatchAPIWebhookWithTokenMessageJSONBody
): Promise<void> {
  await getDiscordRest().patch(Routes.webhookMessage(applicationId, interactionToken, "@original"), { body });
}
