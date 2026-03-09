import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Starting database seed with demo data...');

  // Clean up existing demo data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning up existing demo data...');
  await prisma.doctorSchedule.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.appointment.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.patient.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.appointmentType.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.bookingPageSettings.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.location.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.clinicSchedule.deleteMany({
    where: {
      organization: {
        slug: 'demo-clinic',
      },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      slug: 'demo-clinic',
    },
  });

  // 1. Create Organization
  console.log('📋 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Medical Clinic',
      practiceName: 'Demo Clinic',
      specialty: 'Family Medicine',
      email: 'info@democlinic.com',
      phone: '+15551234567',
      slug: 'demo-clinic',
      subscriptionTier: 'growth',
      status: 'active',
      hipaaCompliant: true,
      baaSigned: true,
      baaSignedAt: new Date(),
    },
  });
  console.log('✅ Created organization:', organization.name);

  // 2. Create Locations
  console.log('📍 Creating locations...');
  const richmondHill = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'RICHMONDHILL',
      address: '123 Main Street',
      city: 'Richmond Hill',
      state: 'ON',
      zipCode: 'L4C 1A1',
      phone: '+15551234568',
      email: 'richmondhill@democlinic.com',
      isActive: true,
    },
  });

  const oshawa = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'OSHAWA',
      address: '456 Oak Avenue',
      city: 'Oshawa',
      state: 'ON',
      zipCode: 'L1H 2B2',
      phone: '+15551234569',
      email: 'oshawa@democlinic.com',
      isActive: true,
    },
  });

  const northYork = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'NORTHYORK',
      address: '789 Yonge Street',
      city: 'North York',
      state: 'ON',
      zipCode: 'M2N 3C3',
      phone: '+15551234570',
      email: 'northyork@democlinic.com',
      isActive: true,
    },
  });
  console.log('✅ Created 3 locations');

  // 3. Create Clinic Schedule
  console.log('🕐 Creating clinic schedule...');
  await prisma.clinicSchedule.create({
    data: {
      organizationId: organization.id,
      timezone: 'America/Toronto',
      mondayOpen: '09:00',
      mondayClose: '18:00',
      tuesdayOpen: '09:00',
      tuesdayClose: '18:00',
      wednesdayOpen: '09:00',
      wednesdayClose: '18:00',
      thursdayOpen: '09:00',
      thursdayClose: '18:00',
      fridayOpen: '09:00',
      fridayClose: '18:00',
      saturdayOpen: '10:00',
      saturdayClose: '14:00',
      sundayOpen: null,
      sundayClose: null,
      aiRingTimeout: 20,
      callRoutingMode: 'business_hours_staff',
    },
  });
  console.log('✅ Created clinic schedule');

  // 4. Create Doctors (Users with role "clinician")
  console.log('👨‍⚕️ Creating doctors...');
  const doctorBola = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: 'dr.bola@democlinic.com',
      passwordHash: '$2a$10$dummyhashfordemo', // Dummy hash for demo
      firstName: 'Bola',
      lastName: 'Smith',
      phone: '+15551234571',
      role: 'clinician',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const doctorO = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: 'dr.o@democlinic.com',
      passwordHash: '$2a$10$dummyhashfordemo', // Dummy hash for demo
      firstName: 'O',
      lastName: 'Johnson',
      phone: '+15551234572',
      role: 'clinician',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Created 2 doctors');

  // 5. Create Doctor Schedules (matching your JSON format)
  console.log('📅 Creating doctor schedules...');

  // Dr. Bola's Schedule
  const drBolaSchedules = [
    { day: 'MONDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'MONDAY', location: 'OSHAWA', start: '2:00PM', end: '6:00PM', note: null },
    { day: 'TUESDAY', location: 'RICHMONDHILL', start: '1:30PM', end: '8:30PM', note: null },
    { day: 'WEDNESDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '6:00PM', note: null },
    { day: 'THURSDAY', location: 'NORTHYORK', start: '2:00PM', end: '6:00PM', note: null },
    { day: 'THURSDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'FRIDAY', location: 'NORTHYORK', start: '2:00PM', end: '6:00PM', note: null },
    { day: 'FRIDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'SATURDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '2:00PM', note: 'ALT', isAlternating: true },
    { day: 'SATURDAY', location: 'OSHAWA', start: '10:00AM', end: '2:00PM', note: 'ALT', isAlternating: true },
    { day: 'SUNDAY', location: 'ALL', start: 'CLOSED', end: 'CLOSED', note: null },
  ];

  for (const schedule of drBolaSchedules) {
    let locationId = null;
    let locationName = null;

    if (schedule.location === 'ALL') {
      locationName = 'ALL';
    } else if (schedule.location === 'RICHMONDHILL') {
      locationId = richmondHill.id;
    } else if (schedule.location === 'OSHAWA') {
      locationId = oshawa.id;
    } else if (schedule.location === 'NORTHYORK') {
      locationId = northYork.id;
    }

    await prisma.doctorSchedule.create({
      data: {
        organizationId: organization.id,
        doctorId: doctorBola.id,
        dayOfWeek: schedule.day,
        locationId,
        locationName,
        startTime: schedule.start,
        endTime: schedule.end,
        isAlternating: schedule.isAlternating || false,
        note: schedule.note,
      },
    });
  }

  // Dr. O's Schedule
  const drOSchedules = [
    { day: 'MONDAY', location: 'NORTHYORK', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'MONDAY', location: 'RICHMONDHILL', start: '2:00PM', end: '5:00PM', note: null },
    { day: 'TUESDAY', location: 'NORTHYORK', start: '2:30PM', end: '6:00PM', note: null },
    { day: 'TUESDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'WEDNESDAY', location: 'NORTHYORK', start: '2:00PM', end: '4:00PM', note: null },
    { day: 'WEDNESDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'THURSDAY', location: 'RICHMONDHILL', start: '2:30PM', end: '6:00PM', note: null },
    { day: 'THURSDAY', location: 'OSHAWA', start: '10:00AM', end: '1:30PM', note: null },
    { day: 'FRIDAY', location: 'RICHMONDHILL', start: '10:00AM', end: '6:00PM', note: null },
    { day: 'SATURDAY', location: 'NORTHYORK', start: '10:00AM', end: '2:00PM', note: 'ALT', isAlternating: true },
    { day: 'SATURDAY', location: 'OSHAWA', start: '10:00AM', end: '2:00PM', note: 'ALT', isAlternating: true },
    { day: 'SUNDAY', location: 'ALL', start: 'CLOSED', end: 'CLOSED', note: null },
  ];

  for (const schedule of drOSchedules) {
    let locationId = null;
    let locationName = null;

    if (schedule.location === 'ALL') {
      locationName = 'ALL';
    } else if (schedule.location === 'RICHMONDHILL') {
      locationId = richmondHill.id;
    } else if (schedule.location === 'OSHAWA') {
      locationId = oshawa.id;
    } else if (schedule.location === 'NORTHYORK') {
      locationId = northYork.id;
    }

    await prisma.doctorSchedule.create({
      data: {
        organizationId: organization.id,
        doctorId: doctorO.id,
        dayOfWeek: schedule.day,
        locationId,
        locationName,
        startTime: schedule.start,
        endTime: schedule.end,
        isAlternating: schedule.isAlternating || false,
        note: schedule.note,
      },
    });
  }
  console.log('✅ Created doctor schedules');

  // 6. Create Appointment Types
  console.log('📝 Creating appointment types...');
  const consultation = await prisma.appointmentType.create({
    data: {
      organizationId: organization.id,
      name: 'Consultation',
      duration: 30,
      description: 'Initial consultation appointment',
      color: '#2563eb',
      isActive: true,
    },
  });

  const followUp = await prisma.appointmentType.create({
    data: {
      organizationId: organization.id,
      name: 'Follow-up',
      duration: 15,
      description: 'Follow-up appointment',
      color: '#10b981',
      isActive: true,
    },
  });

  const physical = await prisma.appointmentType.create({
    data: {
      organizationId: organization.id,
      name: 'Physical Exam',
      duration: 45,
      description: 'Annual physical examination',
      color: '#f59e0b',
      isActive: true,
    },
  });

  const urgent = await prisma.appointmentType.create({
    data: {
      organizationId: organization.id,
      name: 'Urgent Care',
      duration: 20,
      description: 'Urgent care visit',
      color: '#ef4444',
      isActive: true,
    },
  });
  console.log('✅ Created 4 appointment types');

  // 7. Create Booking Page Settings
  console.log('🎨 Creating booking page settings...');
  await prisma.bookingPageSettings.create({
    data: {
      organizationId: organization.id,
      welcomeTitle: 'Book Your Appointment',
      welcomeMessage: 'Welcome to Demo Medical Clinic. Book your appointment online with our experienced doctors.',
      primaryColor: '#2563eb',
      secondaryColor: '#10b981',
      displayPhone: true,
      displayEmail: true,
      displayAddress: true,
      showServices: true,
      showDoctors: true,
      showLocations: true,
      isActive: true,
      metaTitle: 'Book Appointment - Demo Medical Clinic',
      metaDescription: 'Book your appointment online with Demo Medical Clinic. Expert care at multiple locations.',
    },
  });
  console.log('✅ Created booking page settings');

  // 8. Create Sample Patients (optional)
  console.log('👤 Creating sample patients...');
  const patient1 = await prisma.patient.create({
    data: {
      organizationId: organization.id,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15559876543',
      email: 'john.doe@example.com',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'M',
      primaryLocationId: richmondHill.id,
      consentGiven: true,
      consentGivenAt: new Date(),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      organizationId: organization.id,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+15559876544',
      email: 'jane.smith@example.com',
      dateOfBirth: new Date('1990-08-22'),
      gender: 'F',
      primaryLocationId: oshawa.id,
      consentGiven: true,
      consentGivenAt: new Date(),
    },
  });
  console.log('✅ Created 2 sample patients');

  // Summary
  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Organization: ${organization.name} (slug: ${organization.slug})`);
  console.log(`   Locations: 3 (Richmond Hill, Oshawa, North York)`);
  console.log(`   Doctors: 2 (Dr. Bola, Dr. O)`);
  console.log(`   Doctor Schedules: ${drBolaSchedules.length + drOSchedules.length} entries`);
  console.log(`   Appointment Types: 4`);
  console.log(`   Patients: 2`);
  console.log(`\n🌐 Test the booking page at: /booking/${organization.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
