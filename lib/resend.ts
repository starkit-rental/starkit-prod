import { Resend } from "resend";

/**
 * Resend SDK Client for starkit.pl
 * 
 * Initialized with RESEND_API_KEY from environment variables.
 * Used for sending transactional emails from Starkit Office Pro.
 * Email: wynajem@starkit.pl
 */

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    
    resendClient = new Resend(apiKey);
  }
  
  return resendClient;
}

export const resend = getResendClient;
