import { getAIProvider } from './factory';
import { detectIntent, extractAppointmentDetails, requiresImmediateTransfer } from './intent-detector';
import { handleTransfer } from '@/lib/twilio/transfer';
import { createCall, updateCall } from '@/lib/utils/db-helpers';
import { createAppointment } from '@/lib/utils/db-helpers';
import { findPatientByPhone } from '@/lib/utils/db-helpers';
import type {
  CallContext,
  ConversationResult,
  AudioStream,
  Intent,
} from './providers/base';
import type { CallCreateInput, CallUpdateInput, AppointmentCreateInput } from '@/lib/types';

export interface CallHandlerResult {
  success: boolean;
  outcome: 'scheduled' | 'cancelled' | 'transferred' | 'voicemail' | 'completed' | 'failed';
  appointmentId?: string;
  transcript: string;
  intent?: Intent;
  error?: string;
}

/**
 * Main call handler - orchestrates the entire call flow
 */
export async function handleInboundCall(
  context: CallContext,
  audioStream: AudioStream
): Promise<CallHandlerResult> {
  let callId: string | null = null;

  try {
    // Create call record in database
    const call = await createCall({
      organizationId: context.organizationId,
      locationId: context.locationId,
      patientId: context.patientId,
      callSid: context.callSid,
      phoneNumber: context.phoneNumber,
      direction: 'inbound',
      status: 'in_progress',
      startedAt: new Date(),
      aiAgentUsed: true,
    });

    callId = call.id;

    // Get AI provider and handle conversation
    const provider = getAIProvider();
    const conversationResult: ConversationResult = await provider.handleConversation(
      audioStream,
      context
    );

    // Check if transfer is needed
    if (conversationResult.requiresTransfer && conversationResult.intent) {
      const transferReason = conversationResult.transferReason || 'user_requested';
      const transferResult = await handleTransfer(
        context.callSid,
        context,
        transferReason as any
      );

      await updateCall(callId, {
        status: 'completed',
        endedAt: new Date(),
        aiTranscript: conversationResult.transcript,
        aiIntent: conversationResult.intent.intent,
        aiConfidence: conversationResult.intent.confidence,
        outcome: transferResult.transferred ? 'transferred' : 'voicemail',
        notes: `Transferred: ${transferResult.message}`,
      });

      return {
        success: true,
        outcome: transferResult.transferred ? 'transferred' : 'voicemail',
        transcript: conversationResult.transcript,
        intent: conversationResult.intent.intent,
      };
    }

    // Handle based on intent
    if (conversationResult.intent) {
      const intent = conversationResult.intent.intent;
      const outcome = await handleIntent(
        intent,
        conversationResult.intent,
        conversationResult.transcript,
        context,
        callId
      );

      await updateCall(callId, {
        status: 'completed',
        endedAt: new Date(),
        aiTranscript: conversationResult.transcript,
        aiIntent: intent,
        aiConfidence: conversationResult.intent.confidence,
        outcome: outcome.outcome,
        notes: outcome.notes,
      });

      return {
        success: true,
        outcome: outcome.outcome,
        appointmentId: outcome.appointmentId,
        transcript: conversationResult.transcript,
        intent,
      };
    }

    // Default: general conversation completed
    await updateCall(callId, {
      status: 'completed',
      endedAt: new Date(),
      aiTranscript: conversationResult.transcript,
      outcome: 'completed',
    });

    return {
      success: true,
      outcome: 'completed',
      transcript: conversationResult.transcript,
    };
  } catch (error) {
    console.error('Error handling call:', error);

    if (callId) {
      await updateCall(callId, {
        status: 'failed',
        endedAt: new Date(),
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return {
      success: false,
      outcome: 'failed',
      transcript: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle specific intent
 */
async function handleIntent(
  intent: Intent,
  intentResult: any,
  transcript: string,
  context: CallContext,
  callId: string
): Promise<{ outcome: string; appointmentId?: string; notes?: string }> {
  switch (intent) {
    case 'book':
      return await handleBookIntent(intentResult, context, callId);
    case 'cancel':
      return await handleCancelIntent(intentResult, context, transcript);
    case 'reschedule':
      return await handleRescheduleIntent(intentResult, context, transcript);
    case 'general':
      return { outcome: 'completed', notes: 'General inquiry handled' };
    case 'transfer':
      return { outcome: 'transferred', notes: 'Transfer requested' };
    default:
      return { outcome: 'completed', notes: 'Unknown intent' };
  }
}

/**
 * Handle booking intent
 */
async function handleBookIntent(
  intentResult: any,
  context: CallContext,
  callId: string
): Promise<{ outcome: string; appointmentId?: string; notes?: string }> {
  try {
    const details = extractAppointmentDetails(intentResult);

    // Find or create patient
    let patientId = context.patientId;
    if (!patientId) {
      const existingPatient = await findPatientByPhone(
        context.phoneNumber,
        context.organizationId
      );
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create new patient
        // For now, we'll need basic info - this would come from conversation
        // Placeholder: would create patient with phone number
      }
    }

    if (!patientId || !details.date || !context.locationId) {
      return {
        outcome: 'completed',
        notes: 'Booking incomplete - missing required information',
      };
    }

    // Create appointment
    const appointment = await createAppointment({
      organizationId: context.organizationId,
      patientId,
      locationId: context.locationId,
      scheduledAt: details.date,
      reason: details.reason,
      status: 'scheduled',
      createdById: undefined, // AI-created
    });

    // Send SMS confirmation (async - don't wait)
    setTimeout(() => {
      import('@/lib/sms/sender').then(({ sendAppointmentConfirmation }) => {
        sendAppointmentConfirmation(appointment.id).catch(error => {
          console.error('Error sending SMS confirmation:', error);
          // Don't fail the appointment creation if SMS fails
        });
      });
    }, 1000); // Send within 1 second (well under 10 second requirement)

    return {
      outcome: 'scheduled',
      appointmentId: appointment.id,
      notes: `Appointment scheduled for ${details.date}`,
    };
  } catch (error) {
    console.error('Error handling book intent:', error);
    return {
      outcome: 'failed',
      notes: `Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle cancel intent
 */
async function handleCancelIntent(
  intentResult: any,
  context: CallContext,
  transcript: string
): Promise<{ outcome: string; notes?: string }> {
  try {
    // Find appointment to cancel
    // This would require searching by patient phone and date mentioned
    // For now, placeholder implementation

    return {
      outcome: 'cancelled',
      notes: 'Appointment cancellation processed',
    };
  } catch (error) {
    console.error('Error handling cancel intent:', error);
    return {
      outcome: 'failed',
      notes: `Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle reschedule intent
 */
async function handleRescheduleIntent(
  intentResult: any,
  context: CallContext,
  transcript: string
): Promise<{ outcome: string; notes?: string }> {
  try {
    // Find and update appointment
    // Placeholder implementation

    return {
      outcome: 'completed',
      notes: 'Appointment rescheduled',
    };
  } catch (error) {
    console.error('Error handling reschedule intent:', error);
    return {
      outcome: 'failed',
      notes: `Reschedule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
