import { notFound } from 'next/navigation';
import { getBookingPageData } from '@/lib/booking/landing-page';
import ClinicLanding from '@/components/booking/ClinicLanding';
import ClinicInfo from '@/components/booking/ClinicInfo';
import BookingWizard from '@/components/booking/BookingWizard';

interface PageProps {
  params: Promise<{
    organizationSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { organizationSlug } = await params;
  const data = await getBookingPageData(organizationSlug);

  if (!data) {
    return {
      title: 'Booking Page Not Found',
    };
  }

  const metaTitle = data.bookingPageSettings.metaTitle || 
    `Book an Appointment - ${data.organization.name}`;
  const metaDescription = data.bookingPageSettings.metaDescription ||
    data.bookingPageSettings.welcomeMessage ||
    `Book your appointment online at ${data.organization.name}`;

  return {
    title: metaTitle,
    description: metaDescription,
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { organizationSlug } = await params;
  const data = await getBookingPageData(organizationSlug);

  if (!data || !data.bookingPageSettings.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Landing Section */}
      <ClinicLanding
        organization={data.organization}
        settings={data.bookingPageSettings}
      />

      {/* Information Sections */}
      {(data.bookingPageSettings.showServices ||
        data.bookingPageSettings.showDoctors ||
        data.bookingPageSettings.showLocations ||
        data.bookingPageSettings.customContent) && (
        <ClinicInfo
          organization={data.organization}
          settings={data.bookingPageSettings}
          locations={data.locations}
          doctors={data.doctors}
          appointmentTypes={data.appointmentTypes}
        />
      )}

      {/* Booking Wizard */}
      <div id="booking-wizard" className="py-20">
        <div className="container mx-auto px-6">
          <BookingWizard
            organizationId={data.organization.id}
            locations={data.locations}
            doctors={data.doctors}
            appointmentTypes={data.appointmentTypes}
          />
        </div>
      </div>
    </div>
  );
}
