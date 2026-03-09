import { NextRequest, NextResponse } from 'next/server';
import { findOrganizationBySlug } from '@/lib/organization/slugs';

/**
 * GET /api/booking/organization/[slug]
 * Get organization and booking page settings by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const organization = await findOrganizationBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        specialty: organization.specialty,
        practiceName: organization.practiceName,
        phone: organization.phone,
        email: organization.email,
        slug: organization.slug,
      },
      bookingPageSettings: organization.bookingPageSettings || {
        welcomeTitle: 'Book an Appointment',
        welcomeMessage: `Welcome to ${organization.name}. Book your appointment online.`,
        displayPhone: true,
        displayEmail: true,
        displayAddress: true,
        showServices: true,
        showDoctors: true,
        showLocations: true,
        isActive: true,
      },
      locations: organization.locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zipCode,
        phone: loc.phone,
        email: loc.email,
      })),
      doctors: organization.users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
      })),
      appointmentTypes: organization.appointmentTypes.map(type => ({
        id: type.id,
        name: type.name,
        duration: type.duration,
        description: type.description,
        color: type.color,
      })),
    });
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
