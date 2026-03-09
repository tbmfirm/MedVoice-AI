import { prisma } from './lib/db';

async function setupRealOrg() {
  try {
    // Check if organization already exists
    let org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: '+12492097294' },
    });

    if (org) {
      console.log('Organization already exists:', org.name);
      return org;
    }

    // Create new organization with your real Twilio number
    org = await prisma.organization.create({
      data: {
        name: 'My Clinic',
        email: 'clinic@example.com',
        phone: '+14372211910', // Your original clinic number (what you forward from)
        twilioPhoneNumber: '+12492097294', // Your Twilio number
        staffPhoneNumber: '+14372211910', // Staff number to dial (or set to your actual staff number)
      },
    });

    console.log('✅ Created organization:', org.id);

    // Create clinic schedule
    const schedule = await prisma.clinicSchedule.create({
      data: {
        organizationId: org.id,
        timezone: 'America/New_York', // Adjust to your timezone
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
        // Saturday & Sunday closed
        aiRingTimeout: 20, // 20 seconds
        callRoutingMode: 'business_hours_staff', // or 'immediate_ai' to test AI directly
      },
    });

    console.log('✅ Created schedule:', schedule.id);
    console.log('\n📋 Organization Setup:');
    console.log('  Name:', org.name);
    console.log('  Twilio Number:', org.twilioPhoneNumber);
    console.log('  Staff Number:', org.staffPhoneNumber);
    console.log('  Routing Mode:', schedule.callRoutingMode);
    console.log('  Timezone:', schedule.timezone);
    console.log('\n✅ Setup complete! Try calling your Twilio number now.');

    return { org, schedule };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

setupRealOrg().catch(console.error);
