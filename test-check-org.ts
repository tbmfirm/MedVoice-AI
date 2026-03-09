import { prisma } from './lib/db';

async function checkOrg() {
  try {
    const org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: '+15559876543' },
      include: { clinicSchedule: true },
    });
    
    console.log('Organization found:', !!org);
    if (org) {
      console.log('Organization ID:', org.id);
      console.log('Organization name:', org.name);
      console.log('Twilio phone number:', org.twilioPhoneNumber);
      console.log('Has schedule:', !!org.clinicSchedule);
      if (org.clinicSchedule) {
        console.log('Schedule routing mode:', org.clinicSchedule.callRoutingMode);
      }
    } else {
      console.log('❌ Organization not found with twilioPhoneNumber: +15559876543');
      console.log('Checking all organizations...');
      const allOrgs = await prisma.organization.findMany({
        select: { id: true, name: true, twilioPhoneNumber: true },
      });
      console.log('All organizations:', allOrgs);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrg();
