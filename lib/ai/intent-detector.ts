import { getAIProvider } from './factory';
import type { IntentDetectionResult } from './providers/base';

/**
 * Detect intent from conversation transcript
 */
export async function detectIntent(transcript: string): Promise<IntentDetectionResult> {
  const provider = getAIProvider();
  return await provider.detectIntent(transcript);
}

/**
 * Check if intent requires immediate transfer
 */
export function requiresImmediateTransfer(intent: IntentDetectionResult): boolean {
  // Transfer if:
  // 1. Intent is explicitly "transfer"
  // 2. Confidence is very low (< 0.5)
  // 3. Emergency keywords detected
  return (
    intent.intent === 'transfer' ||
    intent.confidence < 0.5
  );
}

/**
 * Extract appointment details from intent result
 */
export interface AppointmentDetails {
  date?: Date;
  time?: string;
  patientName?: string;
  phoneNumber?: string;
  reason?: string;
}

export function extractAppointmentDetails(
  intent: IntentDetectionResult
): AppointmentDetails {
  const details: AppointmentDetails = {};

  if (intent.entities?.date) {
    details.date = new Date(intent.entities.date);
  }

  if (intent.entities?.time) {
    details.time = intent.entities.time;
  }

  if (intent.entities?.patientName) {
    details.patientName = intent.entities.patientName;
  }

  if (intent.entities?.phoneNumber) {
    details.phoneNumber = intent.entities.phoneNumber;
  }

  if (intent.entities?.reason) {
    details.reason = intent.entities.reason;
  }

  return details;
}
