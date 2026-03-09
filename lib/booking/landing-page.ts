import { findOrganizationBySlug } from '@/lib/organization/slugs';

export interface BookingPageData {
  organization: {
    id: string;
    name: string;
    specialty: string | null;
    practiceName: string | null;
    phone: string | null;
    email: string | null;
    slug: string | null;
  };
  bookingPageSettings: {
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    backgroundColor: string | null;
    welcomeTitle: string | null;
    welcomeMessage: string | null;
    heroImageUrl: string | null;
    displayPhone: boolean;
    displayEmail: boolean;
    displayAddress: boolean;
    showServices: boolean;
    showDoctors: boolean;
    showLocations: boolean;
    customContent: string | null;
    footerText: string | null;
    termsUrl: string | null;
    privacyUrl: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    isActive: boolean;
  };
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
    email: string | null;
  }>;
  doctors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string | null;
  }>;
  appointmentTypes: Array<{
    id: string;
    name: string;
    duration: number;
    description: string | null;
    color: string | null;
  }>;
}

/**
 * Get all data needed for landing page
 */
export async function getBookingPageData(organizationSlug: string): Promise<BookingPageData | null> {
  const organization = await findOrganizationBySlug(organizationSlug);

  if (!organization) {
    return null;
  }

  return {
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
      logoUrl: null,
      primaryColor: null,
      secondaryColor: null,
      backgroundColor: null,
      welcomeTitle: 'Book an Appointment',
      welcomeMessage: `Welcome to ${organization.name}. Book your appointment online.`,
      heroImageUrl: null,
      displayPhone: true,
      displayEmail: true,
      displayAddress: true,
      showServices: true,
      showDoctors: true,
      showLocations: true,
      customContent: null,
      footerText: null,
      termsUrl: null,
      privacyUrl: null,
      metaTitle: null,
      metaDescription: null,
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
  };
}

/**
 * Generate CSS variables or inline styles from settings
 */
export function applyBrandingStyles(settings: BookingPageData['bookingPageSettings']): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (settings.primaryColor) {
    styles['--primary-color' as any] = settings.primaryColor;
  }
  if (settings.secondaryColor) {
    styles['--secondary-color' as any] = settings.secondaryColor;
  }
  if (settings.backgroundColor) {
    styles.backgroundColor = settings.backgroundColor;
  }

  return styles;
}
