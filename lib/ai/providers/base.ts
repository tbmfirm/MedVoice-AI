// Base interface for AI providers

export type Intent = 'book' | 'cancel' | 'reschedule' | 'general' | 'transfer';

export interface IntentDetectionResult {
  intent: Intent;
  confidence: number;
  entities?: {
    date?: string;
    time?: string;
    patientName?: string;
    phoneNumber?: string;
    reason?: string;
  };
}

export interface ConversationResult {
  transcript: string;
  intent?: IntentDetectionResult;
  completed: boolean;
  requiresTransfer?: boolean;
  transferReason?: string;
}

export interface CallContext {
  organizationId: string;
  locationId?: string;
  patientId?: string;
  phoneNumber: string;
  callSid: string;
  language?: string;
}

export interface AudioStream {
  // Stream of audio data
  onData: (callback: (data: Buffer) => void) => void;
  onEnd: (callback: () => void) => void;
  write: (data: Buffer) => void;
  end: () => void;
}

/**
 * Base interface for AI providers
 */
export interface AIProvider {
  /**
   * Handle a conversation with audio streaming
   */
  handleConversation(
    audioStream: AudioStream,
    context: CallContext
  ): Promise<ConversationResult>;

  /**
   * Detect intent from transcript
   */
  detectIntent(transcript: string): Promise<IntentDetectionResult>;

  /**
   * Stream audio response
   */
  streamAudio(audioData: Buffer): Promise<Buffer>;
}
