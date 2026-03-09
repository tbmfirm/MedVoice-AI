import { NextRequest } from 'next/server';
import twilio from 'twilio';

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioWebhook(
  request: NextRequest,
  url: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    console.warn('TWILIO_AUTH_TOKEN not set - skipping webhook validation');
    return false;
  }

  const signature = request.headers.get('x-twilio-signature');
  
  if (!signature) {
    console.warn('Missing Twilio signature header');
    return false;
  }

  try {
    // Get form data from request
    // Note: For POST requests, we need to get the raw body
    // Twilio sends form-encoded data
    const params: Record<string, string> = {};
    
    // We'll need to parse the form data from the request
    // For now, we'll validate with empty params if we can't get them
    // The actual validation will happen in the route handler after parsing form data
    
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}

/**
 * Validate Twilio webhook signature with form data
 * Use this version when you have already parsed the form data
 */
export function validateTwilioWebhookWithParams(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    console.warn('TWILIO_AUTH_TOKEN not set - skipping webhook validation');
    return false;
  }

  if (!signature) {
    console.warn('Missing Twilio signature');
    return false;
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}
