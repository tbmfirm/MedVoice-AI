import { prisma } from '@/lib/db';

export interface CallLogData {
  callSid: string;
  organizationId: string;
  from: string;
  to: string;
  patientId?: string;
  status?: string;
  answeredBy?: string;
  duration?: number;
  startedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
}

/**
 * Create initial CallLog entry on webhook hit
 */
export async function logCall(data: CallLogData): Promise<void> {
  try {
    await prisma.callLog.create({
      data: {
        callSid: data.callSid,
        organizationId: data.organizationId,
        from: data.from,
        to: data.to,
        patientId: data.patientId,
        status: data.status || 'initiated',
        answeredBy: data.answeredBy,
        duration: data.duration,
        startedAt: data.startedAt || new Date(),
        answeredAt: data.answeredAt,
        endedAt: data.endedAt,
      },
    });
  } catch (error) {
    console.error('Error logging call:', error);
    // Don't throw - logging should not break the call flow
  }
}

/**
 * Update CallLog with new data
 */
export async function updateCallLog(
  callSid: string,
  data: Partial<CallLogData>
): Promise<void> {
  try {
    await prisma.callLog.update({
      where: { callSid },
      data: {
        status: data.status,
        answeredBy: data.answeredBy,
        duration: data.duration,
        startedAt: data.startedAt,
        answeredAt: data.answeredAt,
        endedAt: data.endedAt,
      },
    });
  } catch (error) {
    console.error('Error updating call log:', error);
    // Don't throw - logging should not break the call flow
  }
}
