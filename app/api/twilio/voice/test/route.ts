import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isWithinBusinessHours } from '@/lib/clinic/schedule';

/**
 * Test endpoint to debug the issue
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST ENDPOINT CALLED ===');
    
    const org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: '+15559876543' },
      include: { clinicSchedule: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!org.clinicSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    console.log('Testing isWithinBusinessHours...');
    let withinHours = false;
    try {
      withinHours = isWithinBusinessHours(org.clinicSchedule);
      console.log('Success! Within hours:', withinHours);
    } catch (error) {
      console.error('ERROR in isWithinBusinessHours:', error);
      if (error instanceof Error) {
        return NextResponse.json({ 
          error: 'Error in isWithinBusinessHours', 
          message: error.message,
          stack: error.stack 
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      organization: org.name,
      hasSchedule: true,
      withinHours,
      routingMode: org.clinicSchedule.callRoutingMode,
    });
  } catch (error) {
    console.error('ERROR in test endpoint:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
