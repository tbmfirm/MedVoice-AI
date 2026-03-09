import { NextRequest, NextResponse } from 'next/server';
import { initiatePortRequest, validatePortEligibility } from '@/lib/twilio/porting';
import { prisma } from '@/lib/db';
import type { PortRequestData } from '@/lib/twilio/porting';

/**
 * Initiate number porting for a clinic
 * POST /api/phone-numbers/port
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phoneNumber,
      organizationId,
      locationId,
      accountNumber,
      accountName,
      address,
      city,
      state,
      zipCode,
      authorizedContactName,
      authorizedContactPhone,
      authorizedContactEmail,
      pin,
      accountPin,
    } = body;

    // Validate required fields
    if (!phoneNumber || !organizationId) {
      return NextResponse.json(
        { error: 'Phone number and organization ID are required' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.phoneNumber.findFirst({
      where: {
        phoneNumber: phoneNumber.replace(/[+\s-()]/g, ''),
        OR: [
          { phoneNumber: phoneNumber },
          { phoneNumber: `+${phoneNumber.replace(/[+\s-()]/g, '')}` },
        ],
      },
    });

    let phoneNumberRecord;
    if (existingPhone) {
      // Update existing record
      phoneNumberRecord = existingPhone;
    } else {
      // Create new phone number record
      phoneNumberRecord = await prisma.phoneNumber.create({
        data: {
          phoneNumber: phoneNumber.replace(/[+\s-()]/g, ''),
          organizationId,
          locationId: locationId || null,
          portStatus: 'not_ported',
          numberSource: 'ported',
        },
      });
    }

    // Validate port eligibility
    const eligibility = await validatePortEligibility(phoneNumber);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'Phone number is not eligible for porting',
          reason: eligibility.reason,
        },
        { status: 400 }
      );
    }

    // Prepare port request data
    const portData: PortRequestData = {
      phoneNumber,
      accountNumber: accountNumber || '',
      accountName: accountName || organization.name,
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      authorizedContactName: authorizedContactName || '',
      authorizedContactPhone: authorizedContactPhone || '',
      authorizedContactEmail: authorizedContactEmail || organization.email || '',
      pin,
      accountPin,
    };

    // Initiate port request
    const result = await initiatePortRequest(phoneNumber, portData);

    return NextResponse.json({
      success: true,
      portRequestId: result.portRequestId,
      status: result.status,
      message: 'Port request initiated successfully. You will be notified when the port completes.',
    });
  } catch (error) {
    console.error('Error initiating port request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Check port status
 * GET /api/phone-numbers/port?portRequestId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portRequestId = searchParams.get('portRequestId');

    if (!portRequestId) {
      return NextResponse.json(
        { error: 'Port request ID is required' },
        { status: 400 }
      );
    }

    const { checkPortStatus } = await import('@/lib/twilio/porting');
    const status = await checkPortStatus(portRequestId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('Error checking port status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
