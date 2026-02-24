/**
 * Resend API Test Script
 * 
 * This script tests your Resend API key by sending a test email.
 * 
 * Usage:
 * 1. Add your Resend API key to .env.local:
 *    RESEND_API_KEY=re_xxxxxxxxx
 * 
 * 2. Run the script:
 *    node scripts/test-resend.js
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function testResend() {
  // Check if API key is set
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: RESEND_API_KEY not found in .env.local');
    console.log('\nPlease add your Resend API key to .env.local:');
    console.log('RESEND_API_KEY=re_xxxxxxxxx');
    console.log('\nReplace re_xxxxxxxxx with your real API key from https://resend.com/api-keys');
    process.exit(1);
  }

  if (apiKey === 're_xxxxxxxxx' || apiKey.includes('your_resend')) {
    console.error('❌ Error: Please replace the placeholder API key with your real Resend API key');
    console.log('\nGet your API key from: https://resend.com/api-keys');
    console.log('Then update RESEND_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('🔑 API Key found, testing Resend...\n');

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'starkit.rental@gmail.com',
      subject: 'Hello World - Starkit Test Email',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p><p>Your Resend integration is working correctly. 🎉</p>',
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('\nCheck your inbox at starkit.rental@gmail.com');
    console.log('\nYour Resend integration is working! 🎉');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testResend();
