/**
 * APNs (Apple Push Notification service) helper.
 * Uses native Node.js http2 + crypto – no external packages needed.
 *
 * WYMAGANE zmienne środowiskowe:
 *   APNS_KEY_ID       – ID klucza z Apple Developer Portal
 *   APNS_TEAM_ID      – Team ID z Apple Developer Portal
 *   APNS_BUNDLE_ID    – Bundle Identifier aplikacji (np. pl.starkit.app)
 *   APNS_PRIVATE_KEY  – Zawartość pliku .p8 (z \n w jednej linii)
 */

import * as crypto from "crypto";
import * as http2 from "http2";

const APNS_KEY_ID = process.env.APNS_KEY_ID;
const APNS_TEAM_ID = process.env.APNS_TEAM_ID;
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID;
const APNS_PRIVATE_KEY = process.env.APNS_PRIVATE_KEY;

export function isAPNsConfigured(): boolean {
  return !!(APNS_KEY_ID && APNS_TEAM_ID && APNS_BUNDLE_ID && APNS_PRIVATE_KEY);
}

/** Send a push notification to a single device */
export async function sendPush(
  deviceToken: string,
  alert: { title: string; body: string },
  data?: Record<string, string>
): Promise<{ success: boolean; status: number }> {
  const jwt = createJWT();
  const isProduction = process.env.NODE_ENV === "production";
  const host = isProduction
    ? "api.push.apple.com"
    : "api.sandbox.push.apple.com";

  const payload = JSON.stringify({
    aps: { alert, sound: "default", badge: 1 },
    ...data,
  });

  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);
    client.on("error", (err) => {
      client.close();
      reject(err);
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID!,
      "apns-push-type": "alert",
      "apns-priority": "10",
    });

    let statusCode = 0;
    req.on("response", (headers) => {
      statusCode = headers[":status"] as number;
    });
    req.on("data", () => {});
    req.on("end", () => {
      client.close();
      resolve({ success: statusCode === 200, status: statusCode });
    });
    req.on("error", (err) => {
      client.close();
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/** Send push to multiple device tokens, returns sent/failed counts */
export async function sendPushToAll(
  tokens: string[],
  alert: { title: string; body: string },
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      const result = await sendPush(token, alert, data);
      if (result.success) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}

// ── JWT creation ──

function createJWT(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID })
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({ iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;

  const key = APNS_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const signer = crypto.createSign("SHA256");
  signer.update(signingInput);
  const derSignature = signer.sign(key);

  const signature = derToJose(derSignature);
  return `${signingInput}.${signature}`;
}

// Convert DER-encoded ECDSA signature → raw R||S (base64url) for JWT
function derToJose(der: Buffer): string {
  let pos = 0;

  if (der[pos++] !== 0x30) throw new Error("Invalid DER: expected SEQUENCE");
  pos += der[pos] >= 0x80 ? (der[pos] & 0x7f) + 1 : 1; // skip length

  if (der[pos++] !== 0x02) throw new Error("Invalid DER: expected INTEGER (R)");
  const rLen = der[pos++];
  const r = der.subarray(pos, pos + rLen);
  pos += rLen;

  if (der[pos++] !== 0x02) throw new Error("Invalid DER: expected INTEGER (S)");
  const sLen = der[pos++];
  const s = der.subarray(pos, pos + sLen);

  return Buffer.concat([fixedSize(r, 32), fixedSize(s, 32)]).toString(
    "base64url"
  );
}

function fixedSize(buf: Buffer, size: number): Buffer {
  if (buf.length === size) return buf;
  if (buf.length > size) return buf.subarray(buf.length - size);
  const padded = Buffer.alloc(size);
  buf.copy(padded, size - buf.length);
  return padded;
}
