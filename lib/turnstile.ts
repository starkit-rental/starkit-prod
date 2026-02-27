/**
 * Cloudflare Turnstile Verification
 * 
 * Better than CAPTCHA:
 * - Invisible to users (no puzzles)
 * - Free tier: 1M verifications/month
 * - Better bot detection
 * - Privacy-friendly (GDPR compliant)
 * 
 * Setup:
 * 1. Get free keys: https://dash.cloudflare.com/
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
 *    TURNSTILE_SECRET_KEY=0x4BBB...
 */

type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
};

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured, skip verification (dev mode)
  if (!secretKey) {
    console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set - skipping verification (DEV MODE ONLY)");
    return true; // Allow in dev, but log warning
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data: TurnstileResponse = await response.json();

    if (!data.success) {
      console.error("[Turnstile] Verification failed:", data["error-codes"]);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Turnstile] Verification error:", error);
    return false;
  }
}

/**
 * Honeypot field detection
 * Bots often fill all fields, including hidden ones
 */
export function detectHoneypot(honeypotValue: string | undefined | null): boolean {
  // If honeypot field is filled, it's likely a bot
  return honeypotValue !== undefined && honeypotValue !== null && honeypotValue !== "";
}

/**
 * Timestamp validation
 * Bots often submit forms instantly (< 3 seconds)
 * Humans need at least 3-5 seconds to fill a checkout form
 */
export function validateFormTiming(timestamp: string | undefined): boolean {
  if (!timestamp) {
    // If no timestamp, allow (backward compatibility)
    return true;
  }

  try {
    const formStartTime = new Date(timestamp).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - formStartTime) / 1000;

    // Form filled in less than 3 seconds? Likely a bot
    if (elapsedSeconds < 3) {
      console.warn(`[Bot Detection] Form submitted too quickly: ${elapsedSeconds}s`);
      return false;
    }

    // Form open for more than 1 hour? Likely stale/suspicious
    if (elapsedSeconds > 3600) {
      console.warn(`[Bot Detection] Form submitted after too long: ${elapsedSeconds}s`);
      return false;
    }

    return true;
  } catch {
    return true; // Invalid timestamp format, allow (backward compatibility)
  }
}
