import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not found. Twilio features will be disabled.');
}

export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null;

/**
 * Verify Twilio webhook signature
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken) {
    return false;
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Error verifying Twilio signature:', error);
    return false;
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's already US format
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Otherwise, try to add + if missing
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}

/**
 * Make an outbound call
 */
export async function makeCall(
  to: string,
  from: string,
  url: string,
  options?: {
    statusCallback?: string;
    statusCallbackEvent?: string[];
    record?: boolean;
  }
) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const call = await twilioClient.calls.create({
      to: formatPhoneNumber(to),
      from: formatPhoneNumber(from),
      url,
      statusCallback: options?.statusCallback,
      statusCallbackEvent: options?.statusCallbackEvent || ['completed', 'failed'],
      record: options?.record || false,
    });

    return call;
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
}

/**
 * Send SMS message
 */
export async function sendSMS(
  to: string,
  from: string,
  body: string,
  options?: {
    statusCallback?: string;
  }
) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const message = await twilioClient.messages.create({
      to: formatPhoneNumber(to),
      from: formatPhoneNumber(from),
      body,
      statusCallback: options?.statusCallback,
    });

    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Get call details
 */
export async function getCall(callSid: string) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    return await twilioClient.calls(callSid).fetch();
  } catch (error) {
    console.error('Error fetching call:', error);
    throw error;
  }
}

/**
 * Update call (e.g., redirect)
 */
export async function updateCall(
  callSid: string,
  url: string,
  method: 'GET' | 'POST' = 'POST'
) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    return await twilioClient.calls(callSid).update({
      url,
      method,
    });
  } catch (error) {
    console.error('Error updating call:', error);
    throw error;
  }
}
