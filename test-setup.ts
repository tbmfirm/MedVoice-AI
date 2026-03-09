import { prisma } from './lib/db';

async function setupTestData() {
  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Clinic',
      email: 'test@clinic.com',
      phone: '+15551234567', // Clinic's original number (what they forward from)
      staffPhoneNumber: '+15559876543', // Staff number to dial
      twilioPhoneNumber: '+15559876543',
      // Note: twilioPhoneNumber will be set when you provision a number
    },
  });

  // Create clinic schedule
  const schedule = await prisma.clinicSchedule.create({
    data: {
      organizationId: org.id,
      timezone: 'America/New_York',
      // Monday-Friday: 9 AM - 5 PM
      mondayOpen: '09:00',
      mondayClose: '17:00',
      tuesdayOpen: '09:00',
      tuesdayClose: '17:00',
      wednesdayOpen: '09:00',
      wednesdayClose: '17:00',
      thursdayOpen: '09:00',
      thursdayClose: '17:00',
      fridayOpen: '09:00',
      fridayClose: '17:00',
      // Saturday & Sunday closed (null)
      aiRingTimeout: 20, // 20 seconds
      callRoutingMode: 'business_hours_staff', // Test different modes
    },
  });

  console.log('Test organization created:', org.id);
  console.log('Test schedule created:', schedule.id);
  return { org, schedule };
}

setupTestData().catch(console.error);